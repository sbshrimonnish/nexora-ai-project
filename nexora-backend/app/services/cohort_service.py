"""
Nexora AI — Cohort Analytics Service
Bins customers by historical_tenure_months into cohorts.
All metrics derived from actual dataset values.
"""
import logging
from typing import Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

COHORT_BINS   = [0, 6, 12, 24, 36, 60, 10000]
COHORT_LABELS = ["0–6 months", "6–12 months", "12–24 months", "24–36 months", "36–60 months", "60+ months"]

_cohort_cache: Optional[list] = None


def get_cohort_analytics() -> list[dict]:
    global _cohort_cache
    if _cohort_cache is not None:
        return _cohort_cache

    from app.services.churn_service import get_churn_predictions
    df = get_churn_predictions()

    df["cohort"] = pd.cut(
        df["historical_tenure_months"],
        bins=COHORT_BINS,
        labels=COHORT_LABELS,
        right=True
    ).astype(str)

    result = []
    for label in COHORT_LABELS:
        sub = df[df["cohort"] == label]
        if len(sub) == 0:
            continue
        result.append({
            "cohort_label":    label,
            "customer_count":  int(len(sub)),
            "avg_clv":         round(float(sub["predicted_clv"].mean()), 2),
            "total_clv":       round(float(sub["predicted_clv"].sum()), 2),
            "avg_tenure":      round(float(sub["historical_tenure_months"].mean()), 1),
            "avg_mrr":         round(float(sub["current_mrr"].mean()), 2),
            "avg_health":      round(float(sub["health_score"].mean()), 1),
            "avg_adoption":    round(float(sub["current_feature_adoption_rate"].mean()), 4),
            "avg_churn_prob":  round(float(sub["churn_probability"].mean()), 4),
            "trajectory_pct": {
                "Increasing": round(float((sub["clv_trajectory"] == "Increasing").mean() * 100), 1),
                "Stable":     round(float((sub["clv_trajectory"] == "Stable").mean() * 100), 1),
                "Declining":  round(float((sub["clv_trajectory"] == "Declining").mean() * 100), 1),
            },
        })

    _cohort_cache = result
    return result


def invalidate_cohorts():
    global _cohort_cache
    _cohort_cache = None
