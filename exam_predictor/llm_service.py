"""
llm_service.py – Gemini Flash integration for two purposes:
    1. Extracting & categorizing questions from raw PDF text.
    2. Generating a natural-language prediction justification.
"""

import json
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

_MODEL = "gemini-1.5-flash"  # Free tier, fast, high availability
_model = genai.GenerativeModel(_MODEL)


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

EXTRACT_SYSTEM_PROMPT = """You are an expert academic question analyzer.
You will be given the raw text of an exam paper and the context of its subject.
Your job is to extract each distinct question and assign it a precise, technical topic label.

Rules for topic labeling:
1. Be SPECIFIC to the subject (e.g. for 'Superconducting Materials': 'Flux Quantization', not just 'Magnetism')
2. Keep topic names CONSISTENT across papers (same concept → same label)
3. Prefer established academic/textbook chapter names
4. Never use vague labels like 'Other' or 'Misc'
"""

EXTRACT_USER_TEMPLATE = """Subject: {subject_name}
Exam Type: {exam_type}
Exam Name / Series: {exam_name}
Year: {year}

Raw Exam Text:
---
{raw_text}
---

Return ONLY a valid JSON array (no markdown). Each element:
{{
    "question_text": "<full question>",
    "topic_name":    "<precise topic label>"
}}
"""


def extract_questions_from_text(
    raw_text: str,
    subject_name: str,
    exam_type: str,
    exam_name: str,
    year: int,
) -> list[dict]:
    """
    Calls Gemini Flash to parse raw PDF text into structured questions with topic labels.

    Returns a list of dicts: [{"question_text": ..., "topic_name": ...}, ...]
    """
    prompt = EXTRACT_USER_TEMPLATE.format(
        subject_name=subject_name,
        exam_type=exam_type,
        exam_name=exam_name,
        year=year,
        raw_text=raw_text[:12000],  # Stay well within token limits
    )

    response = _model.generate_content(
        contents=[
            {"role": "user", "parts": [{"text": EXTRACT_SYSTEM_PROMPT + "\n\n" + prompt}]}
        ],
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,  # Low temperature → consistent, deterministic labels
        ),
    )

    return json.loads(response.text)


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

PREDICT_SYSTEM_PROMPT = """You are an expert academic exam strategist.
You will be given historical exam question data for a specific subject and exam type.
Your task is to predict the 3–5 most likely topics to appear in the UPCOMING exam of the same type.

Be analytical:
- Weight topics that appear in MULTIPLE years more heavily
- Note if a topic appeared recently (more recent = higher priority)
- If a topic has been absent for 2+ years, flag it as a 'due' topic
- Keep your reasoning concise but technical
"""

PREDICT_USER_TEMPLATE = """Subject: {subject_name}
Course Code: {course_code}
Predicting for: {exam_type} (Exam series: {exam_name})

Historical topic frequency (last {num_years} years):
{topic_summary}

Respond ONLY as valid JSON (no markdown):
{{
    "predictions": [
        {{
            "rank": 1,
            "topic_name": "<topic>",
            "confidence": "High | Medium | Low",
            "reasoning":  "<1-2 sentence justification>"
        }}
    ],
    "overall_summary": "<2-3 sentence overall analysis>"
}}
"""


def predict_topics(
    course_code: str,
    subject_name: str,
    exam_type: str,
    exam_name: str,
    topic_frequency_by_year: dict,
) -> dict:
    """
    Calls Gemini Flash to generate ranked topic predictions with justifications.

    Args:
        topic_frequency_by_year: {year: {topic_name: count}, ...}

    Returns parsed JSON prediction dict.
    """
    # Flatten into a readable summary string for the prompt
    lines = []
    for year in sorted(topic_frequency_by_year.keys()):
        topics = topic_frequency_by_year[year]
        ranked = sorted(topics.items(), key=lambda x: x[1], reverse=True)
        lines.append(f"  {year}: " + ", ".join(f"{t} ({c}x)" for t, c in ranked))

    topic_summary = "\n".join(lines) if lines else "No historical data available."
    num_years = len(topic_frequency_by_year)

    prompt = PREDICT_USER_TEMPLATE.format(
        subject_name=subject_name,
        course_code=course_code,
        exam_type=exam_type,
        exam_name=exam_name,
        num_years=num_years,
        topic_summary=topic_summary,
    )

    response = _model.generate_content(
        contents=[
            {"role": "user", "parts": [{"text": PREDICT_SYSTEM_PROMPT + "\n\n" + prompt}]}
        ],
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    return json.loads(response.text)
