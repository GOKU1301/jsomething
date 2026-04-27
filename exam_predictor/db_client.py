"""
db_client.py – All Supabase interactions for the exam_predictor service.
"""

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE = "extracted_questions"


def fetch_topics_for_prediction(
    course_code: str,
    exam_type: str,
    exam_name: str | None = None,
) -> list[dict]:
    """
    Fetches all historical question records from Supabase filtered by
    course_code + exam_type (and optionally exam_name).

    This is the core filter that enforces Step 3 of the design:
    "only T3 PYQ topics for a subject/exam combination are considered
    when predicting T3 topics."

    Args:
        course_code: Subject code, e.g. "15B11PH211"
        exam_type:   T1 / T2 / T3
        exam_name:   Optional exam series name, e.g. "A"

    Returns:
        List of rows from the extracted_questions table.
    """
    query = (
        _supabase.table(TABLE)
        .select("year, exam_type, exam_name, topic_name, question_text")
        .eq("course_code", course_code)
        .eq("exam_type", exam_type)
        .order("year", desc=False)
    )

    if exam_name:
        query = query.eq("exam_name", exam_name)

    response = query.execute()
    return response.data or []


def insert_extracted_questions(rows: list[dict]) -> None:
    """
    Inserts a batch of extracted questions/topics into Supabase.

    Each dict in `rows` must match the `extracted_questions` schema:
    {
        "course_code":   str,
        "subject_name":  str,
        "year":          int,
        "exam_type":     str,   # T1 / T2 / T3
        "exam_name":     str,   # e.g. "A"
        "question_text": str,
        "topic_name":    str,
    }
    """
    if not rows:
        return
    _supabase.table(TABLE).insert(rows).execute()
