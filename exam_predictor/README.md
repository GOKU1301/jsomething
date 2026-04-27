# Exam Predictor Microservice

An LLM-powered Python service that:
1. **Extracts** questions from PYQ PDFs and categorizes them by topic using Gemini Flash.
2. **Predicts** high-probability topics for upcoming exams based on historical patterns.

---

## Project Structure

```
exam_predictor/
├── app.py          # FastAPI entry point (API routes)
├── config.py       # Environment variable loading & validation
├── db_client.py    # Supabase read/write operations
├── extractor.py    # PDF → text → LLM → Supabase pipeline
├── llm_service.py  # Gemini Flash integration (extraction + prediction prompts)
├── models.py       # Pydantic request/response models
├── predictor.py    # Aggregation logic + chart data builder
├── schema.sql      # Supabase table definition (run once)
├── requirements.txt
└── .env.example    # Copy to .env and fill in credentials
```

---

## Supabase Setup (Do This First)

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Note down: **Project URL** and **anon/public API Key** (from *Settings → API*).
3. Open **SQL Editor** in Supabase and paste the contents of `schema.sql`. Click **Run**.

Your `.env` file needs:
```
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-anon-key>
```

---

## Gemini API Key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Create a free key. Gemini 1.5 Flash has a **generous free tier** (15 RPM, 1M tokens/day).

Your `.env` file needs:
```
GEMINI_API_KEY=<your-gemini-key>
```

---

## Running the Service

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env from example
copy .env.example .env     # Windows
# cp .env.example .env     # macOS/Linux
# ... then edit .env with real credentials

# 4. Start the server
python app.py
# Server starts at http://localhost:5001
# Interactive API docs: http://localhost:5001/docs
```

---

## API Endpoints

### `POST /extract`
Upload a PYQ PDF to extract and store questions.

```bash
curl -X POST http://localhost:5001/extract \
  -F "file=@maths_2023_T3.pdf" \
  -F "course_code=15B11MA211" \
  -F "subject_name=Engineering Mathematics" \
  -F "exam_type=T3" \
  -F "exam_name=A" \
  -F "year=2023"
```

### `POST /predict`
Get ranked topic predictions with chart data.

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "course_code":  "15B11MA211",
    "subject_name": "Engineering Mathematics",
    "exam_type":    "T3",
    "exam_name":    "A"
  }'
```

### `GET /health`
Liveness check — returns `{"status": "ok"}`.

---

## Integration with Main Project

The React frontend calls this service directly for predictions.
Spring Boot does **not** need to be changed — both backends run independently.

| Service | Port | Responsibility |
|---|---|---|
| Spring Boot | 8081 | PYQ metadata & PDF file management |
| exam_predictor (Python) | 5001 | Topic extraction & LLM predictions |
| React (frontend) | 3000 | UI — calls both backends |
