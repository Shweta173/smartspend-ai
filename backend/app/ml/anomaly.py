"""
Anomaly detection using a per-category z-score.
Flags transactions whose amount is unusually high for their category.
"""
from __future__ import annotations
import logging
import numpy as np

logger = logging.getLogger(__name__)

MIN_SAMPLES_PER_CATEGORY = 5
Z_SCORE_THRESHOLD = 2.5


def detect_anomaly(
    amount: float,
    category_id: int,
    category_amounts: list[float],
) -> tuple[bool, float, str]:
    """
    Returns (is_anomaly, score, reason).
    score is 0–1 (higher = more anomalous).
    """
    if len(category_amounts) < MIN_SAMPLES_PER_CATEGORY:
        return False, 0.0, ""

    arr = np.array(category_amounts, dtype=float)
    mean = float(np.mean(arr))
    std = float(np.std(arr))

    if std < 1.0:
        return False, 0.0, ""

    z = (amount - mean) / std
    score = min(abs(z) / 10.0, 1.0)

    if z > Z_SCORE_THRESHOLD:
        reason = f"Amount ₹{amount:,.0f} is {z:.1f}× std above the category average (₹{mean:,.0f})"
        return True, score, reason

    return False, 0.0, ""


def batch_detect(
    amounts: list[float],
    category_ids: list[int],
) -> list[tuple[bool, float, str]]:
    """Run anomaly detection across a batch of transactions."""
    from collections import defaultdict

    # Group amounts by category
    cat_amounts: dict[int, list[float]] = defaultdict(list)
    for amt, cat_id in zip(amounts, category_ids):
        cat_amounts[cat_id].append(amt)

    results = []
    for amt, cat_id in zip(amounts, category_ids):
        # Exclude the current transaction from its own category history
        history = [a for a in cat_amounts[cat_id] if a != amt]
        is_anom, score, reason = detect_anomaly(amt, cat_id, history)
        results.append((is_anom, score, reason))

    return results
