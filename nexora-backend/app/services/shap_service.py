"""
Nexora AI — SHAP Explanation Service
Provides global feature importance and local per-customer explanations.
Uses SHAP TreeExplainer for tree-based models, LinearExplainer for linear.
All values come from the real trained model — never hardcoded.
"""
import json
import logging
from pathlib import Path
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logger.warning("SHAP not available — explanations will return unavailable state")

from app.config import settings
from app.services.preprocessing import FEATURE_COLUMNS, DISPLAY_FEATURE_NAMES
from app.services.training_service import get_model

GLOBAL_SHAP_PATH = Path(settings.artifacts_dir) / "explanations" / "global_shap.json"

# Cache
_explainer = None
_shap_values_sample = None   # computed on a sample for speed


def _get_explainer():
    global _explainer
    if _explainer is not None:
        return _explainer

    if not SHAP_AVAILABLE:
        return None

    model, meta = get_model()

    from sklearn.linear_model import LinearRegression
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

    if hasattr(model, "estimators_") or hasattr(model, "feature_importances_"):
        # Tree-based: use TreeExplainer
        _explainer = shap.TreeExplainer(model)
    else:
        # Linear: use LinearExplainer — need background data
        from app.services.preprocessing import get_X_y
        X, _ = get_X_y()
        background = shap.maskers.Independent(X.iloc[:200], max_samples=200)
        _explainer = shap.LinearExplainer(model, background)

    return _explainer


def get_global_importance() -> list[dict]:
    """
    Global feature importance via mean |SHAP|.
    Cached after first computation.
    """
    if GLOBAL_SHAP_PATH.exists():
        with open(GLOBAL_SHAP_PATH) as f:
            return json.load(f)

    if not SHAP_AVAILABLE:
        return _fallback_importance()

    try:
        explainer = _get_explainer()
        from app.services.preprocessing import get_X_y
        X, _ = get_X_y()

        # Use a stratified 500-row sample for speed
        sample = X.sample(n=min(500, len(X)), random_state=42)
        shap_vals = explainer.shap_values(sample)

        mean_abs = np.abs(shap_vals).mean(axis=0)
        total = mean_abs.sum()

        results = []
        for i, feat in enumerate(FEATURE_COLUMNS):
            imp = float(mean_abs[i])
            results.append({
                "feature":      feat,
                "display_name": DISPLAY_FEATURE_NAMES.get(feat, feat),
                "importance":   round(imp, 6),
                "importance_pct": round(imp / total * 100, 2) if total > 0 else 0.0,
                "direction":    "positive",  # direction from local analysis
                "rank":         0,
            })

        results = sorted(results, key=lambda r: -r["importance"])
        for i, r in enumerate(results):
            r["rank"] = i + 1

        with open(GLOBAL_SHAP_PATH, "w") as f:
            json.dump(results, f, indent=2)

        return results

    except Exception as e:
        logger.error(f"SHAP global computation failed: {e}")
        return _fallback_importance()


def get_local_explanation(account_id: int) -> dict:
    """
    Local SHAP explanation for a specific customer.
    Returns top positive and negative SHAP drivers.
    """
    if not SHAP_AVAILABLE:
        return {
            "account_id": account_id,
            "available": False,
            "method": "unavailable",
            "note": "SHAP library not installed",
            "base_value": None,
            "predicted_clv": None,
            "top_drivers": [],
        }

    try:
        from app.services.segmentation import get_enriched_df
        df = get_enriched_df()
        row = df[df["account_id"] == account_id]
        if len(row) == 0:
            return {"account_id": account_id, "available": False, "note": "Customer not found"}

        X_row = row[FEATURE_COLUMNS].values
        explainer = _get_explainer()
        shap_vals = explainer.shap_values(X_row)[0]

        model, meta = get_model()
        base_value = float(explainer.expected_value
                           if not hasattr(explainer.expected_value, "__len__")
                           else explainer.expected_value[0])
        predicted_clv = float(row["predicted_clv"].values[0])

        drivers = []
        for i, feat in enumerate(FEATURE_COLUMNS):
            sv = float(shap_vals[i])
            fv = float(X_row[0][i])
            drivers.append({
                "feature":        feat,
                "display_name":   DISPLAY_FEATURE_NAMES.get(feat, feat),
                "shap_value":     round(sv, 4),
                "feature_value":  round(fv, 4),
                "direction":      "positive" if sv >= 0 else "negative",
            })

        drivers = sorted(drivers, key=lambda d: abs(d["shap_value"]), reverse=True)

        return {
            "account_id":   account_id,
            "available":    True,
            "method":       "SHAP TreeExplainer" if hasattr(explainer, "model") else "SHAP LinearExplainer",
            "note":         "SHAP values from real trained model",
            "base_value":   round(base_value, 4),
            "predicted_clv": round(predicted_clv, 4),
            "top_drivers":  drivers[:12],
        }

    except Exception as e:
        logger.error(f"Local SHAP failed for {account_id}: {e}")
        return {
            "account_id": account_id,
            "available": False,
            "method": "error",
            "note": str(e),
        }


def _fallback_importance() -> list[dict]:
    """Fallback to model feature_importances_ if SHAP unavailable."""
    try:
        model, _ = get_model()
        if hasattr(model, "feature_importances_"):
            imps = model.feature_importances_
            results = []
            for i, feat in enumerate(FEATURE_COLUMNS):
                results.append({
                    "feature":      feat,
                    "display_name": DISPLAY_FEATURE_NAMES.get(feat, feat),
                    "importance":   round(float(imps[i]), 6),
                    "importance_pct": round(float(imps[i] * 100), 2),
                    "direction":    "positive",
                    "rank":         i + 1,
                    "method":       "model_feature_importances (not SHAP)",
                })
            return sorted(results, key=lambda r: -r["importance"])
    except Exception:
        pass
    return []


def invalidate_shap():
    global _explainer, _shap_values_sample
    _explainer = None
    _shap_values_sample = None
    if GLOBAL_SHAP_PATH.exists():
        GLOBAL_SHAP_PATH.unlink()


class SHAPService:
    def get_global_feature_importance(self) -> list:
        return get_global_importance()

    def get_local_explanation(self, account_id: str) -> dict:
        return get_local_explanation(account_id)


shap_service = SHAPService()

