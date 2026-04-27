"""
extractor.py – Handles PDF ingestion: reads the file, sends text to the LLM,
and stores each extracted question in Supabase.
"""

import io
import pdfplumber
from llm_service import extract_questions_from_text
from db_client import insert_extracted_questions


def extract_and_store(
    pdf_bytes: bytes,
    course_code: str,
    subject_name: str,
    exam_type: str,      # T1 / T2 / T3
    exam_name: str,      # e.g. "A"
    year: int,
) -> int:
    """
    Full pipeline: PDF → text → LLM extraction → Supabase storage.

    Args:
        pdf_bytes:    Raw bytes of the uploaded PDF.
        course_code:  e.g. "15B11PH211"
        subject_name: e.g. "Superconducting, Materials and Magnets"
        exam_type:    T1, T2, or T3
        exam_name:    Exam series identifier, e.g. "A"
        year:         Academic year, e.g. 2023

    Returns:
        Number of questions successfully extracted and stored.
    """
    # 1. Extract raw text from the PDF
    raw_text = _read_pdf(pdf_bytes)
    if not raw_text.strip():
        raise ValueError("No readable text found in the uploaded PDF.")

    # 2. Ask LLM to extract structured questions + assign topic labels
    extracted = extract_questions_from_text(
        raw_text=raw_text,
        subject_name=subject_name,
        exam_type=exam_type,
        exam_name=exam_name,
        year=year,
    )

    if not extracted:
        raise ValueError("LLM returned no questions from the document.")

    # 3. Attach metadata to each row before inserting
    rows = [
        {
            "course_code":   course_code,
            "subject_name":  subject_name,
            "year":          year,
            "exam_type":     exam_type,
            "exam_name":     exam_name,
            "question_text": item.get("question_text", ""),
            "topic_name":    item.get("topic_name", "Unknown"),
        }
        for item in extracted
        if item.get("question_text")  # Skip any empty entries
    ]

    # 4. Bulk insert into Supabase
    insert_extracted_questions(rows)

    return len(rows)


def _read_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF byte stream using pdfplumber."""
    full_text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
    return full_text
