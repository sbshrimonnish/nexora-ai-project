"""
Nexora AI — Segmentation Service
Assigns CLV segments, trajectories, and health scores from real data.
All rules are documented — no arbitrary assignments.

Segmentation rule (percentile-based on predicted CLV):
  High Value:          predicted_clv >= P85
  Growth Opportunity:  P65 <= predicted_clv < P85
  Stable Value:        P40 <= predicted_clv < P65
  Developing:          P20 <= predicted_clv < P40
  Declining Value:     predicted_clv < P20 AND mrr_growth < -0.05
  Low Value:           predicted_clv < P20 AND mrr_growth >= -0.05

Trajectory (from mrr_growth_first3_to_last3):
  Increasing:  mrr_growth > 0.05
  Stable:     -0.05 <= mrr_growth <= 0.05
  Declining:   mrr_growth < -0.05

Health Score (0–100, composite):
  40% × feature_adoption_rate (normalized 0–1 → 0–40)
  25% × usage_growth clipped to [0,1]
  20% × (1 - payment_delay_rate) × 20
  15% × (1 - error_rate clipped to [0,1]) × 15
"""
import logging
from typing import Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

SEGMENT_COLORS = {
    "High Value":         "#6366f1",
    "Growth Opportunity": "#8b5cf6",
    "Stable Value":       "#3b82f6",
    "Developing":         "#10b981",
    "Declining Value":    "#f59e0b",
    "Low Value":          "#6b7280",
}

# Singleton cache
_enriched_df: Optional[pd.DataFrame] = None


def compute_health_score(df: pd.DataFrame) -> pd.Series:
    """Composite health score 0–100 from behavioral signals."""
    adoption  = df["current_feature_adoption_rate"].clip(0, 1) * 40
    usage_g   = df["current_usage_growth"].clip(0, 1) * 25
    payment   = (1 - df["payment_delay_rate"].clip(0, 1)) * 20
    error     = (1 - df["current_error_rate"].clip(0, 1)) * 15
    score     = adoption + usage_g + payment + error
    return score.clip(0, 100).round(1)


def assign_segments(df: pd.DataFrame) -> pd.DataFrame:
    """
    Assign CLV segment, trajectory, and health score.
    Uses predicted_clv — requires clv_service to have run first.
    """
    clv = df["predicted_clv"]
    p20 = clv.quantile(0.20)
    p40 = clv.quantile(0.40)
    p65 = clv.quantile(0.65)
    p85 = clv.quantile(0.85)

    mrr_growth = df["mrr_growth_first3_to_last3"]

    def _segment(row):
        c = row["predicted_clv"]
        g = row["mrr_growth_first3_to_last3"]
        if c >= p85:
            return "High Value"
        if c >= p65:
            return "Growth Opportunity"
        if c >= p40:
            return "Stable Value"
        if c >= p20:
            return "Developing"
        if g < -0.05:
            return "Declining Value"
        return "Low Value"

    df["clv_segment"] = df.apply(_segment, axis=1)

    df["clv_trajectory"] = np.where(
        mrr_growth > 0.05, "Increasing",
        np.where(mrr_growth < -0.05, "Declining", "Stable")
    )

    df["health_score"] = compute_health_score(df)
    return df


def get_enriched_df() -> pd.DataFrame:
    """Return full dataframe with predictions + segments + health (cached)."""
    global _enriched_df
    if _enriched_df is not None:
        return _enriched_df

    from app.services.clv_service import get_predictions_df
    df = get_predictions_df().copy()
    df = assign_segments(df)
    _enriched_df = df
    logger.info("Segmentation and health scores computed.")
    return _enriched_df


def invalidate_enriched():
    global _enriched_df
    _enriched_df = None


def get_segment_summary() -> list[dict]:
    df = get_enriched_df()
    total_clv = df["predicted_clv"].sum()

    rows = []
    for seg, color in SEGMENT_COLORS.items():
        sub = df[df["clv_segment"] == seg]
        if len(sub) == 0:
            continue
        seg_clv = sub["predicted_clv"].sum()
        rows.append({
            "segment":    seg,
            "count":      int(len(sub)),
            "total_clv":  round(float(seg_clv), 2),
            "avg_clv":    round(float(sub["predicted_clv"].mean()), 2),
            "revenue_pct": round(float(seg_clv / total_clv * 100), 2) if total_clv > 0 else 0.0,
            "avg_tenure": round(float(sub["historical_tenure_months"].mean()), 1),
            "avg_health": round(float(sub["health_score"].mean()), 1),
            "color":      color,
        })
    return sorted(rows, key=lambda r: -r["total_clv"])


def get_clv_distribution(bins: int = 10) -> list[dict]:
    df = get_enriched_df()
    clv = df["predicted_clv"]
    cut = pd.cut(clv, bins=bins)
    grouped = clv.groupby(cut, observed=True).agg(["count", "min", "max"])

    result = []
    for interval, row in grouped.iterrows():
        lo = interval.left
        hi = interval.right
        result.append({
            "range_label": _format_clv_label(lo, hi),
            "count": int(row["count"]),
            "min_clv": round(float(lo), 2),
            "max_clv": round(float(hi), 2),
        })
    return result


def _format_clv_label(lo: float, hi: float) -> str:
    def _fmt(v):
        if v >= 1_000_000: return f"₹{v/1_000_000:.1f}M"
        if v >= 1_000:     return f"₹{v/1_000:.0f}K"
        return f"₹{v:.0f}"
    return f"{_fmt(lo)}–{_fmt(hi)}"


class SegmentationService:
    def get_enriched_df(self) -> pd.DataFrame:
        return get_enriched_df()

    def get_clv_summary(self) -> dict:
        return get_clv_summary()

    def get_segment_summary(self) -> list[dict]:
        return get_segment_summary()

    def get_clv_distribution(self, bins: int = 10) -> list[dict]:
        return get_clv_distribution(bins=bins)


segmentation_service = SegmentationService()

