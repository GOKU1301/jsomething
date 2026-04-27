"""
predictor.py – Core prediction logic that sits between the DB client and LLM service.
Aggregates historical data into a frequency map and passes it to the LLM.
"""

from collections import defaultdict
from db_client import fetch_topics_for_prediction
from llm_service import predict_topics


def build_prediction(
    course_code: str,
    subject_name: str,
    exam_type: str,
    exam_name: str | None = None,
) -> dict:
    """
    Main prediction function. Fetches historical data, aggregates topic frequencies
    per year, and asks the LLM for ranked predictions with justifications.

    Returns:
        {
            "predictions": [{"rank": 1, "topic_name": ..., "confidence": ..., "reasoning": ...}],
            "overall_summary": "...",
            "chart_data": [{"year": 2021, "topics": {"Flux Quantization": 2, ...}}, ...]
        }
    """
    # 1. Fetch historical records (enforced filter: same course_code + exam_type + exam_name)
    records = fetch_topics_for_prediction(course_code, exam_type, exam_name)

    if not records:
        return {
            "predictions": [],
            "overall_summary": f"No historical {exam_type} data found for {course_code}.",
            "chart_data": [],
        }

    # 2. Aggregate: topic_frequency_by_year[year][topic] = count
    freq: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in records:
        year = row["year"]
        topic = row["topic_name"]
        freq[year][topic] += 1

    # Convert defaultdicts to plain dicts for serialization
    freq_plain = {year: dict(topics) for year, topics in freq.items()}

    # 3. Get LLM prediction + justification
    llm_result = predict_topics(
        course_code=course_code,
        subject_name=subject_name,
        exam_type=exam_type,
        exam_name=exam_name or "General",
        topic_frequency_by_year=freq_plain,
    )

    # 4. Build chart_data in a format ready for Recharts on the frontend
    chart_data = _build_chart_data(freq_plain)

    return {
        "predictions": llm_result.get("predictions", []),
        "overall_summary": llm_result.get("overall_summary", ""),
        "chart_data": chart_data,
    }


def _build_chart_data(freq_by_year: dict[int, dict[str, int]]) -> list[dict]:
    """
    Converts the frequency map into a flat list of per-year dicts.
    Each entry includes all topic counts for that year (unknown topics default to 0).

    Shape: [{"year": 2021, "Topic A": 2, "Topic B": 1}, ...]
    This format works directly with Recharts <BarChart>.
    """
    if not freq_by_year:
        return []

    all_topics = sorted({t for topics in freq_by_year.values() for t in topics})

    chart: list[dict] = []
    for year in sorted(freq_by_year.keys()):
        entry: dict = {"year": year}
        for topic in all_topics:
            entry[topic] = freq_by_year[year].get(topic, 0)
        chart.append(entry)

    return chart
