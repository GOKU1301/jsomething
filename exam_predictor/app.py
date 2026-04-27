"""
app.py – FastAPI entry point for the exam_predictor microservice.

Endpoints:
  POST /extract   – Upload a PYQ PDF, extract + store topics via Gemini Flash
  POST /predict   – Get ranked topic predictions + chart data for an exam type
  GET  /health    – Service health check
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import PORT
from models import ExtractRequest, ExtractResponse, PredictRequest, PredictResponse
from extractor import extract_and_store
from predictor import build_prediction


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Exam Predictor",
    description=(
        "LLM-powered microservice that extracts topics from PYQ PDFs "
        "and predicts high-probability topics for upcoming exams."
    ),
    version="1.0.0",
)

# Allow requests from the React frontend (adjust origin in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
def health_check():
    """Quick liveness probe."""
    return {"status": "ok", "service": "exam_predictor"}


# ---------------------------------------------------------------------------
# Extract endpoint
# ---------------------------------------------------------------------------

@app.post("/extract", response_model=ExtractResponse, tags=["Extraction"])
async def extract(
    file:         UploadFile = File(..., description="PYQ exam paper PDF"),
    course_code:  str  = Form(...),
    subject_name: str  = Form(...),
    exam_type:    str  = Form(...),
    exam_name:    str  = Form(...),
    year:         int  = Form(...),
):
    """
    Upload a past question paper PDF.
    The service will:
      1. Extract raw text from the PDF via pdfplumber.
      2. Send the text to Gemini Flash to identify each question and assign
         a precise, subject-aware topic label.
      3. Store all <question_text, topic_name, metadata> rows in Supabase.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Validate form fields via the Pydantic model
    _ = ExtractRequest(
        course_code=course_code,
        subject_name=subject_name,
        exam_type=exam_type,
        exam_name=exam_name,
        year=year,
    )

    pdf_bytes = await file.read()

    try:
        count = extract_and_store(
            pdf_bytes=pdf_bytes,
            course_code=course_code,
            subject_name=subject_name,
            exam_type=exam_type,
            exam_name=exam_name,
            year=year,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    return ExtractResponse(status="success", questions_stored=count)


# ---------------------------------------------------------------------------
# Predict endpoint
# ---------------------------------------------------------------------------

@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
def predict(body: PredictRequest):
    """
    Given a course, exam type, and optional exam series name, return:
      - Ranked list of predicted topics (with confidence + LLM reasoning)
      - Overall summary paragraph
      - chart_data ready for Recharts BarChart on the frontend

    **Step 3 guarantee**: only PYQs of the *exact* exam_type (and exam_name,
    if provided) are fetched from Supabase — no cross-contamination between
    T1, T2, and T3 data.
    """
    try:
        result = build_prediction(
            course_code=body.course_code,
            subject_name=body.subject_name,
            exam_type=body.exam_type,
            exam_name=body.exam_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    return PredictResponse(**result)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)
