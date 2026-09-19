"""
Nexora AI — Preprocessing Service
Prepares the feature-ready dataset for model training.
No raw data is overwritten. Returns encoded copies.
"""
import json
import logging
from pathlib import Path
from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from app.config import settings
from app.services.dataset_service import (
    load_dataset, CATEGORICAL_COLUMNS, CLV_TARGET_COLUMN
)

logger = logging.getLogger(__name__)

# Feature columns (excludes target and account_id)
FEATURE_COLUMNS = [
    "company_size_enc", "industry_enc", "contract_type_enc", "regime_state_enc",
    "discount_pct", "historical_tenure_months", "current_mrr", "current_active_users",
    "current_usage_growth", "current_feature_adoption_rate", "current_error_rate",
    "current_tickets_count", "current_ticket_growth", "current_payment_delay_flag",
    "hist_mrr_mean", "hist_mrr_std", "hist_mrr_min", "hist_mrr_max",
    "hist_active_users_mean", "hist_usage_growth_mean", "hist_adoption_mean",
    "hist_error_rate_mean", "hist_tickets_mean", "hist_ticket_growth_mean",
    "payment_delay_rate", "recent_3m_mrr_mean", "recent_3m_active_users_mean",
    "recent_3m_adoption_mean", "recent_3m_tickets_mean", "recent_3m_error_rate_mean",
    "mrr_growth_first3_to_last3", "active_users_trend_first3_to_last3",
    "adoption_trend_first3_to_last3", "tickets_trend_first3_to_last3",
    "error_rate_trend_first3_to_last3",
]

DISPLAY_FEATURE_NAMES = {
    "company_size_enc":                    "Company Size",
    "industry_enc":                        "Industry",
    "contract_type_enc":                   "Contract Type",
    "regime_state_enc":                    "Regime / Account State",
    "discount_pct":                        "Discount %",
    "historical_tenure_months":            "Account Tenure (months)",
    "current_mrr":                         "Current MRR",
    "current_active_users":                "Active Users",
    "current_usage_growth":                "Usage Growth",
    "current_feature_adoption_rate":       "Feature Adoption Rate",
    "current_error_rate":                  "Error Rate",
    "current_tickets_count":               "Support Ticket Count",
    "current_ticket_growth":               "Support Ticket Growth",
    "current_payment_delay_flag":          "Payment Delay (current)",
    "hist_mrr_mean":                       "Hist. Mean MRR",
    "hist_mrr_std":                        "MRR Volatility (std)",
    "hist_mrr_min":                        "Hist. Min MRR",
    "hist_mrr_max":                        "Hist. Max MRR",
    "hist_active_users_mean":              "Hist. Avg Active Users",
    "hist_usage_growth_mean":              "Hist. Avg Usage Growth",
    "hist_adoption_mean":                  "Hist. Avg Adoption",
    "hist_error_rate_mean":                "Hist. Avg Error Rate",
    "hist_tickets_mean":                   "Hist. Avg Ticket Count",
    "hist_ticket_growth_mean":             "Hist. Avg Ticket Growth",
    "payment_delay_rate":                  "Payment Delay Rate",
    "recent_3m_mrr_mean":                  "Recent 3M Avg MRR",
    "recent_3m_active_users_mean":         "Recent 3M Avg Active Users",
    "recent_3m_adoption_mean":             "Recent 3M Avg Adoption",
    "recent_3m_tickets_mean":              "Recent 3M Avg Tickets",
    "recent_3m_error_rate_mean":           "Recent 3M Avg Error Rate",
    "mrr_growth_first3_to_last3":          "MRR Growth Trend",
    "active_users_trend_first3_to_last3":  "Active Users Trend",
    "adoption_trend_first3_to_last3":      "Adoption Trend",
    "tickets_trend_first3_to_last3":       "Support Tickets Trend",
    "error_rate_trend_first3_to_last3":    "Error Rate Trend",
}

# Singleton encoders cache
_encoders: dict = {}
_processed_df: pd.DataFrame | None = None


def get_processed_df() -> pd.DataFrame:
    """Return label-encoded feature DataFrame (cached)."""
    global _processed_df, _encoders

    if _processed_df is not None:
        return _processed_df

    df = load_dataset().copy()

    # Label encode categoricals
    for col in CATEGORICAL_COLUMNS:
        enc = LabelEncoder()
        df[f"{col}_enc"] = enc.fit_transform(df[col].astype(str))
        _encoders[col] = enc

    # Fill any rare NaN with 0 (defensive)
    for col in FEATURE_COLUMNS:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    _processed_df = df
    logger.info("Preprocessing complete.")

    # Save feature dictionary
    _save_feature_dictionary()

    return _processed_df


def get_X_y() -> Tuple[pd.DataFrame, pd.Series]:
    """Return feature matrix X and CLV target y."""
    df = get_processed_df()
    X = df[FEATURE_COLUMNS]
    y = df[CLV_TARGET_COLUMN]
    return X, y


def get_encoder(col: str) -> LabelEncoder:
    get_processed_df()   # ensure encoders are built
    return _encoders[col]


def _save_feature_dictionary():
    """Save feature dictionary to artifacts."""
    fd_path = Path(settings.artifacts_dir) / "feature_dictionary.json"
    if fd_path.exists():
        return

    entries = []
    for feat in FEATURE_COLUMNS:
        display = DISPLAY_FEATURE_NAMES.get(feat, feat)
        source = feat.replace("_enc", "")
        is_encoded = feat.endswith("_enc")
        entries.append({
            "feature_name":          feat,
            "display_name":          display,
            "source_column":         source,
            "data_type":             "categorical (label-encoded)" if is_encoded else "numerical",
            "transformation":        "LabelEncoder" if is_encoded else "none (pre-engineered)",
            "available_at_cutoff":   True,
            "leakage_risk":          False,
            "reason_for_use":        (
                "Categorical firmographic signal" if is_encoded
                else "Pre-engineered from historical SaaS behavioral data"
            ),
        })

    with open(fd_path, "w") as f:
        json.dump({"feature_count": len(entries), "features": entries}, f, indent=2)

    logger.info("Feature dictionary saved.")


class PreprocessingService:
    def get_processed_df(self) -> pd.DataFrame:
        return get_processed_df()

    def get_X_y(self) -> Tuple[pd.DataFrame, pd.Series]:
        return get_X_y()

    def prepare_features_and_target(self, df: pd.DataFrame):
        X, y = get_X_y()
        num_cols = [c for c in FEATURE_COLUMNS if not c.endswith("_enc")]
        cat_cols = [c for c in FEATURE_COLUMNS if c.endswith("_enc")]
        return X, y, cat_cols, num_cols


preprocessing_service = PreprocessingService()

