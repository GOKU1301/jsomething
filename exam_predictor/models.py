"""
models.py – Pydantic request/response models for the FastAPI endpoints.
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Extraction endpoint models
# ---------------------------------------------------------------------------

class ExtractRequest(BaseModel):
    """
    Metadata that MUST accompany the PDF upload.
    The PDF file itself is received as multipart/form-data alongside these fields.
    """
    course_code:  str = Field(..., example="15B11PH211")
    subject_name: str = Field(..., example="Superconducting, Materials and Magnets")
    exam_type:    str = Field(..., pattern="^(T1|T2|T3)$", example="T3")
    exam_name:    str = Field(..., example="A")
    year:         int = Field(..., ge=2000, le=2099, example=2023)


class ExtractResponse(BaseModel):
    status:            str
    questions_stored:  int


# ---------------------------------------------------------------------------
# Prediction endpoint models
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    course_code:  str = Field(..., example="15B11PH211")
    subject_name: str = Field(..., example="Superconducting, Materials and Magnets")
    exam_type:    str = Field(..., pattern="^(T1|T2|T3)$", example="T3")
    exam_name:    str | None = Field(
        default=None,
        example="A",
        description="Optional. If set, only PYQs from this exam series are considered.",
    )


class TopicPrediction(BaseModel):
    rank:       int
    topic_name: str
    confidence: str   # "High" | "Medium" | "Low"
    reasoning:  str


class PredictResponse(BaseModel):
    predictions:     list[TopicPrediction]
    overall_summary: str
    chart_data:      list[dict]  # [{year, topic1: count, topic2: count, ...}]
