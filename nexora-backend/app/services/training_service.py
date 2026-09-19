"""
Nexora AI — Model Training Service
Trains 4 CLV regression candidates on a sequential train/test split.
All metrics are from actual held-out test evaluation — never fabricated.

Target: clv_target_12m_revenue_based (12-month future revenue-based CLV)
Split:  First 80% of accounts = train | Last 20% = test (sequential by account_id)
"""
import json
import logging
import pickle
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Callable

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)

try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available — will skip XGBRegressor")

from app.config import settings
from app.services.preprocessing import get_X_y, FEATURE_COLUMNS

MODEL_PATH      = Path(settings.model_dir) / "best_clv_model.pkl"
METRICS_PATH    = Path(settings.artifacts_dir) / "metrics" / "model_comparison.json"
META_PATH       = Path(settings.model_dir) / "model_meta.json"

# Singleton trained model
_model = None
_model_meta: dict = {}


def _mape(y_true, y_pred) -> Optional[float]:
    """MAPE with explicit zero-value handling — returns None if >50% zeros."""
    nonzero = y_true != 0
    if nonzero.sum() < len(y_true) * 0.5:
        return None  # Too many zeros for meaningful MAPE
    return float(np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100)


def train_all_models(progress_cb: Optional[Callable[[float, str], None]] = None) -> dict:
    """
    Train all candidate CLV models and select the best one.
    Returns comparison dict with metrics for all candidates.
    """
    from app.services.preprocessing import get_X_y

    if progress_cb:
        progress_cb(0.05, "Loading and preprocessing dataset…")

    X, y = get_X_y()
    n = len(X)
    split = int(n * 0.80)

    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    logger.info(f"Train: {len(X_train):,} | Test: {len(X_test):,}")

    candidates = {
        "LinearRegression": LinearRegression(),
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=200, max_depth=12, min_samples_leaf=5,
            n_jobs=-1, random_state=42
        ),
        "GradientBoostingRegressor": GradientBoostingRegressor(
            n_estimators=200, learning_rate=0.05, max_depth=5,
            subsample=0.8, random_state=42
        ),
    }
    if XGBOOST_AVAILABLE:
        candidates["XGBRegressor"] = XGBRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=6,
            subsample=0.8, colsample_bytree=0.8, random_state=42,
            verbosity=0, n_jobs=-1
        )

    results = []
    total = len(candidates)

    for i, (name, model) in enumerate(candidates.items()):
        pct = 0.10 + (i / total) * 0.75
        if progress_cb:
            progress_cb(pct, f"Training {name}…")

        t0 = time.time()
        model.fit(X_train, y_train)
        elapsed = time.time() - t0

        y_pred = model.predict(X_test)
        y_pred_clipped = np.clip(y_pred, 0, None)  # CLV can't be negative

        mae   = float(mean_absolute_error(y_test, y_pred_clipped))
        rmse  = float(np.sqrt(mean_squared_error(y_test, y_pred_clipped)))
        r2    = float(r2_score(y_test, y_pred_clipped))
        mape  = _mape(y_test.values, y_pred_clipped)

        results.append({
            "model":         name,
            "mae":           round(mae, 4),
            "rmse":          round(rmse, 4),
            "r2":            round(r2, 6),
            "mape":          round(mape, 2) if mape is not None else None,
            "train_time_s":  round(elapsed, 2),
            "train_size":    int(len(X_train)),
            "test_size":     int(len(X_test)),
            "_model_obj":    model,
        })
        logger.info(f"{name}: R²={r2:.4f} | MAE={mae:.2f} | RMSE={rmse:.2f}")

    if progress_cb:
        progress_cb(0.88, "Selecting best model…")

    # Select: best R² (ties broken by RMSE)
    best = max(results, key=lambda r: (r["r2"], -r["rmse"]))
    best_model = best["_model_obj"]
    best_name  = best["model"]

    # Save best model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)

    # Build meta
    meta = {
        "model_name":          best_name,
        "model_version":       f"v{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
        "trained_at":          datetime.now(timezone.utc).isoformat(),
        "clv_horizon_months":  settings.clv_horizon,
        "target_definition":   "12-month future revenue-based CLV (clv_target_12m_revenue_based)",
        "train_size":          int(len(X_train)),
        "test_size":           int(len(X_test)),
        "features":            FEATURE_COLUMNS,
        "feature_count":       len(FEATURE_COLUMNS),
        "mae":                 best["mae"],
        "rmse":                best["rmse"],
        "r2":                  best["r2"],
        "mape":                best["mape"],
        "split_strategy":      "Sequential 80/20 split by account_id order (leakage-safe)",
        "selection_reason":    f"Highest R² ({best['r2']:.4f}) among all candidates",
    }

    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    # Build comparison report (strip private model objects)
    comparison = {
        "candidates":       [{k: v for k, v in r.items() if k != "_model_obj"} for r in results],
        "selected_model":   best_name,
        "selection_reason": meta["selection_reason"],
        "train_split":      "Sequential 80/20 (temporal proxy)",
        "test_period_note": "Last 20% of account IDs used as holdout — simulates future prediction",
    }
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(comparison, f, indent=2)

    if progress_cb:
        progress_cb(1.0, f"Training complete. Best model: {best_name} (R²={best['r2']:.4f})")

    global _model, _model_meta
    _model = best_model
    _model_meta = meta

    return comparison


def get_model():
    """Load and cache the trained model. Raises if not trained yet."""
    global _model, _model_meta
    if _model is not None:
        return _model, _model_meta

    if MODEL_PATH.exists() and META_PATH.exists():
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(META_PATH) as f:
            _model_meta = json.load(f)
        logger.info(f"Loaded model from disk: {_model_meta.get('model_name')}")
        return _model, _model_meta

    raise RuntimeError(
        "Model not trained yet. POST /api/model/train to train, "
        "or wait for auto-training on startup."
    )


def get_model_metrics() -> Optional[dict]:
    """Return model metadata/metrics or None if not trained."""
    if META_PATH.exists():
        with open(META_PATH) as f:
            return json.load(f)
    return None


def get_model_comparison() -> Optional[dict]:
    """Return model comparison table or None if not available."""
    if METRICS_PATH.exists():
        with open(METRICS_PATH) as f:
            return json.load(f)
    return None


def is_trained() -> bool:
    return MODEL_PATH.exists() and META_PATH.exists()


class TrainingService:
    def train_all_candidates(self) -> dict:
        return train_all_models()

    def get_active_model_metrics(self) -> Optional[dict]:
        return get_model_metrics()

    def load_best_model(self):
        return load_best_model()

    def get_model_comparison(self) -> Optional[dict]:
        return get_model_comparison()

    def is_trained(self) -> bool:
        return is_trained()


training_service = TrainingService()

