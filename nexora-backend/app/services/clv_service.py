"""
Nexora AI — CLV Prediction Service
Applies the trained model to the full 50K dataset.
All predictions come from the actual trained model — never fabricated.
"""
import logging
from typing import Optional
import numpy as np
import pandas as pd

from app.services.dataset_service import load_dataset, CLV_TARGET_COLUMN
from app.services.preprocessing import get_processed_df, FEATURE_COLUMNS, get_encoder
from app.services.training_service import get_model, is_trained

logger = logging.getLogger(__name__)

# Singleton prediction cache
_predictions_df: Optional[pd.DataFrame] = None


def get_predictions_df() -> pd.DataFrame:
    """
    Return full dataframe with model predictions appended.
    Lazy-loads and caches. Raises RuntimeError if model not trained.
    """
    global _predictions_df
    if _predictions_df is not None:
        return _predictions_df

    if not is_trained():
        raise RuntimeError("Model not trained. POST /api/model/train first.")

    model, meta = get_model()
    df = get_processed_df().copy()

    X = df[FEATURE_COLUMNS]
    preds = model.predict(X)
    preds = np.clip(preds, 0, None)  # CLV is non-negative

    df["predicted_clv"] = preds

    _predictions_df = df
    logger.info(f"Predictions generated for {len(df):,} customers.")
    return _predictions_df


def invalidate_predictions():
    """Call after retraining to force re-prediction."""
    global _predictions_df
    _predictions_df = None


class CLVService:
    def predict_all(self) -> dict:
        df = get_predictions_df()
        return {
            row["account_id"]: {"predicted_clv": float(row["predicted_clv"])}
            for _, row in df.head(100).iterrows()
        }

    def get_predictions_df(self) -> pd.DataFrame:
        return get_predictions_df()


clv_service = CLVService()

