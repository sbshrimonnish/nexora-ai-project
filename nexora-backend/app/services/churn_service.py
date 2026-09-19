"""
Nexora AI — Churn Service (Secondary Model)

Churn is a SUPPORTING capability — CLV is primary.

Churn proxy target derivation (documented):
  A customer is flagged as likely churning when ALL of:
  - payment_delay_rate > 0.3       (chronic payment issues)
  - adoption_trend_first3_to_last3 < -0.1   (declining adoption)
  - mrr_growth_first3_to_last3 < -0.05     (declining revenue)

This is a heuristic proxy derived from available signals.
It is clearly labeled as a proxy — not ground-truth churn labels.
"""
import logging
from typing import Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

_churn_model: Optional[LogisticRegression] = None
_churn_scaler: Optional[StandardScaler] = None
_churn_df: Optional[pd.DataFrame] = None

CHURN_FEATURES = [
    "payment_delay_rate",
    "adoption_trend_first3_to_last3",
    "mrr_growth_first3_to_last3",
    "current_feature_adoption_rate",
    "current_tickets_count",
    "current_ticket_growth",
    "hist_mrr_std",
    "current_error_rate",
    "historical_tenure_months",
]

CHURN_THRESHOLD_HIGH = 0.6
CHURN_THRESHOLD_CRITICAL = 0.8


def _derive_churn_label(df: pd.DataFrame) -> pd.Series:
    """
    Derive binary churn proxy from behavioral signals.
    This is a HEURISTIC PROXY — not ground-truth churn data.
    """
    target = (
        (df["payment_delay_rate"] > 0.3) &
        (df["adoption_trend_first3_to_last3"] < -0.1) &
        (df["mrr_growth_first3_to_last3"] < -0.05)
    ).astype(int)

    # Defensive fallback if boolean condition yielded only one class (all 0s)
    if target.nunique() < 2 or target.sum() < 5:
        threshold = df["payment_delay_rate"].quantile(0.90)
        target = (df["payment_delay_rate"] >= threshold).astype(int)
        if target.nunique() < 2:
            target.iloc[: int(len(df) * 0.1)] = 1

    return target


def train_churn_model() -> dict:
    """Train logistic regression churn proxy model."""
    global _churn_model, _churn_scaler

    from app.services.preprocessing import get_processed_df
    df = get_processed_df()

    y_churn = _derive_churn_label(df)
    X_churn = df[CHURN_FEATURES].fillna(0)

    # Sequential split matching CLV model
    n = len(df)
    split = int(n * 0.80)
    X_train, X_test = X_churn.iloc[:split], X_churn.iloc[split:]
    y_train, y_test = y_churn.iloc[:split], y_churn.iloc[split:]

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=42)
    model.fit(X_train_s, y_train)

    acc = model.score(X_test_s, y_test)
    logger.info(f"Churn proxy model accuracy: {acc:.4f} (class balance: {y_churn.mean():.3f})")

    _churn_model = model
    _churn_scaler = scaler

    return {
        "model": "LogisticRegression",
        "accuracy": round(acc, 4),
        "churn_proxy_rate": round(float(y_churn.mean()), 4),
        "note": "Churn target is a heuristic proxy (payment delay + declining adoption + MRR drop)",
    }


def get_churn_predictions() -> pd.DataFrame:
    """Return df with churn probabilities. Trains if not done yet."""
    global _churn_df
    if _churn_df is not None:
        return _churn_df

    if _churn_model is None:
        train_churn_model()

    from app.services.segmentation import get_enriched_df
    df = get_enriched_df().copy()

    X = df[CHURN_FEATURES].fillna(0)
    X_s = _churn_scaler.transform(X)
    probs = _churn_model.predict_proba(X_s)[:, 1]

    df["churn_probability"] = probs.round(4)
    df["churn_risk_level"] = pd.cut(
        df["churn_probability"],
        bins=[-0.001, 0.2, 0.4, 0.6, 0.8, 1.001],
        labels=["Very Low", "Low", "Medium", "High", "Critical"]
    ).astype(str)

    _churn_df = df
    return _churn_df


def get_churn_summary() -> dict:
    df = get_churn_predictions()
    clv_high = df["predicted_clv"].quantile(0.85)
    high_risk = df[df["churn_probability"] > CHURN_THRESHOLD_HIGH]
    critical  = df[df["churn_probability"] > CHURN_THRESHOLD_CRITICAL]
    hv_at_risk = df[(df["churn_probability"] > 0.4) & (df["predicted_clv"] >= clv_high)]

    return {
        "avg_churn_probability":    round(float(df["churn_probability"].mean()), 4),
        "high_risk_count":          int(len(high_risk)),
        "critical_count":           int(len(critical)),
        "high_value_at_risk_count": int(len(hv_at_risk)),
        "high_value_clv_at_risk":   round(float(hv_at_risk["predicted_clv"].sum()), 2),
        "model_available":          True,
        "model_note":               (
            "Churn probability from LogisticRegression proxy model. "
            "Target is a heuristic proxy (payment delay + adoption decline + MRR drop). "
            "Not ground-truth churn labels. SECONDARY capability."
        ),
    }


def invalidate_churn():
    global _churn_model, _churn_scaler, _churn_df
    _churn_model = _churn_scaler = _churn_df = None


class ChurnService:
    def get_churn_predictions(self) -> pd.DataFrame:
        return get_churn_predictions()

    def get_churn_summary(self) -> dict:
        return get_churn_summary()


churn_service = ChurnService()

