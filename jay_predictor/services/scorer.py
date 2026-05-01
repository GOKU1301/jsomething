from collections import defaultdict


def compute_predictions(history: list[dict], current_year: int) -> list[dict]:
    """
    Takes all doc_topics rows for a subject/exam_type,
    applies weighting logic, and returns ranked predictions.

    history: list of dicts with keys: topic, year, frequency
    current_year: the year we are predicting FOR
    Returns: list of dicts sorted by confidence_score desc
    """
    # ── Step 1: Aggregate by topic across all years ─────────────────────────
    # topic -> { year -> total_frequency }
    topic_year_map: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for row in history:
        topic = row["topic"].strip().lower()
        year = int(row["year"])
        freq = int(row.get("frequency", 1))
        topic_year_map[topic][year] += freq

    predictions = []

    for topic, year_freq in topic_year_map.items():
        years_seen = sorted(year_freq.keys())
        last_appeared = max(years_seen)
        gap = current_year - last_appeared           # years since last appearance
        total_appearances = len(years_seen)
        total_freq = sum(year_freq.values())

        # ── Step 2: Base score from normalised total frequency ───────────────
        # Topics that recur over many years get a proportionally higher base
        recurrence_ratio = total_appearances / max(1, (current_year - min(years_seen) + 1))
        base_score = min(1.0, recurrence_ratio * 1.5)

        # ── Step 3: Recency multiplier ───────────────────────────────────────
        if gap == 0 or gap == 1:
            # Appeared very recently — slight penalty (examiners avoid repeats)
            recency_mult = 0.70
            reason = "appeared recently (slight penalty)"
        elif gap == 2:
            # One cycle away — neutral to slight bonus
            recency_mult = 1.10
            reason = "one cycle away (slight due-bonus)"
        elif gap == 3:
            # Strong due-bonus: examiners tend to revisit every 3 years
            recency_mult = 1.55
            reason = "3-year cycle — strongly due"
        else:
            # Long absence — moderate bonus, might be niche
            recency_mult = 1.30
            reason = f"absent for {gap} years (overdue bonus)"

        # ── Step 4: Frequency trend detection (rising vs. falling) ──────────
        trend_mult = _detect_trend(year_freq, current_year)

        # ── Step 5: Saturation penalty (appeared in EVERY recent year) ───────
        recent_years = [y for y in years_seen if y >= current_year - 3]
        consecutive_recent = len(recent_years)
        saturation_mult = 1.0
        if consecutive_recent >= 3:
            saturation_mult = 0.60
            reason += " | saturated (3+ consecutive years)"

        # ── Step 6: Single-appearance discount ───────────────────────────────
        if total_appearances == 1:
            base_score *= 0.75  # might just be noise

        # ── Final score ───────────────────────────────────────────────────────
        raw = base_score * recency_mult * trend_mult * saturation_mult
        confidence = round(min(1.0, raw) * 100, 1)  # 0–100

        predictions.append({
            "topic": topic,
            "confidence_score": confidence,
            "years_appeared": years_seen,
            "gap_years": gap,
            "total_occurrences": total_appearances,
            "reasoning": reason,
        })

    # Sort descending by confidence
    predictions.sort(key=lambda x: x["confidence_score"], reverse=True)
    return predictions


def _detect_trend(year_freq: dict[int, int], current_year: int) -> float:
    """
    Return a multiplier based on whether topic frequency is rising or falling.
    1.30 if clearly rising, 0.85 if clearly falling, 1.0 if stable.
    """
    sorted_years = sorted(year_freq.keys())
    if len(sorted_years) < 2:
        return 1.0

    # Compare frequency in first half vs. second half of history
    mid = len(sorted_years) // 2
    first_half_avg = sum(year_freq[y] for y in sorted_years[:mid]) / mid
    second_half_avg = sum(year_freq[y] for y in sorted_years[mid:]) / (len(sorted_years) - mid)

    if second_half_avg > first_half_avg * 1.25:
        return 1.30   # clearly trending up
    elif second_half_avg < first_half_avg * 0.75:
        return 0.85   # clearly trending down
    return 1.0        # stable
