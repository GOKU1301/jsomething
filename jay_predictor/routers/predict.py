from fastapi import APIRouter, HTTPException
from supabase import create_client
from services.scorer import compute_predictions
import os
from datetime import datetime

router = APIRouter()

# Lazy Supabase client — initialized on first request, not at import time
_supabase = None

def get_supabase():
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )
    return _supabase

CURRENT_YEAR = datetime.now().year


@router.get("/")
async def predict(
    subject_code: str,
    exam_type: str,
    year: int = CURRENT_YEAR
):
    """
    Main prediction endpoint.
    Query params:
      - subject_code  (e.g. CS301)
      - exam_type     (e.g. T1, T2, T3)
      - year          (defaults to current year)
    """
    supabase = get_supabase()

    # ── Fetch all historical topics for this subject+exam from Supabase ────
    resp = supabase.table("doc_topics") \
        .select("topic, year, frequency, subject_code, exam_type") \
        .eq("subject_code", subject_code) \
        .eq("exam_type", exam_type) \
        .execute()

    history = resp.data if resp.data else []

    if not history:
        raise HTTPException(
            status_code=404,
            detail=f"No PYQ data found for {subject_code} {exam_type}. Upload some papers first."
        )

    # ── Run the scorer ──────────────────────────────────────────────────────
    predictions = compute_predictions(history, year)
    top_10 = predictions[:10]

    # ── Persist predictions to Supabase ────────────────────────────────────
    # Get subject_name from pyq table (best-effort)
    pyq_resp = supabase.table("pyq") \
        .select("subject") \
        .eq("subject_code", subject_code) \
        .limit(1) \
        .execute()
    subject_name = pyq_resp.data[0]["subject"] if pyq_resp.data else subject_code

    rows_to_save = [
        {
            "subject_code":     subject_code,
            "subject_name":     subject_name,
            "exam_type":        exam_type,
            "predicted_year":   year,
            "topic":            p["topic"],
            "confidence_score": p["confidence_score"] / 100,  # store as 0.0–1.0
            "reasoning":        p["reasoning"]
        }
        for p in top_10
    ]

    # Delete stale predictions before inserting fresh ones
    supabase.table("predictions") \
        .delete() \
        .eq("subject_code", subject_code) \
        .eq("exam_type", exam_type) \
        .eq("predicted_year", year) \
        .execute()

    if rows_to_save:
        supabase.table("predictions").insert(rows_to_save).execute()

    # ── Return response ─────────────────────────────────────────────────────
    return {
        "subject_code":     subject_code,
        "subject_name":     subject_name,
        "exam_type":        exam_type,
        "predicted_year":   year,
        "papers_analysed":  len({r["year"] for r in history}),
        "predictions":      top_10
    }


@router.get("/available-subjects")
async def get_available_subjects():
    """List all subjects that have processed PYQ data in doc_topics."""
    supabase = get_supabase()
    resp = supabase.table("doc_topics") \
        .select("subject_code, exam_type") \
        .execute()

    if not resp.data:
        return {"subjects": []}

    # Deduplicate
    seen = set()
    subjects = []
    for row in resp.data:
        key = (row["subject_code"], row["exam_type"])
        if key not in seen:
            seen.add(key)
            subjects.append({"subject_code": row["subject_code"], "exam_type": row["exam_type"]})

    return {"subjects": subjects}
