"""
Model metrics, feature importance, training, and retraining router.
Background training uses a thread so the API stays responsive.
"""
import threading
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/model", tags=["model"])

# Simple in-memory job registry (academic use — no persistence needed beyond session)
_jobs: dict = {}


@router.get("/metrics", response_model=Envelope)
def model_metrics(_user=Depends(get_current_user)):
    from app.services.training_service import get_model_metrics, get_model_comparison
    metrics = get_model_metrics()
    if not metrics:
        return Envelope(
            success=False,
            message="Model not trained yet. POST /api/model/train to start training.",
            data=None,
        )
    comparison = get_model_comparison()
    return Envelope(data={"metrics": metrics, "comparison": comparison})


@router.get("/feature-importance", response_model=Envelope)
def feature_importance(_user=Depends(get_current_user)):
    from app.services.shap_service import get_global_importance
    data = get_global_importance()
    if not data:
        return Envelope(
            success=False,
            message="Feature importance not available — model may not be trained.",
            data=[],
        )
    return Envelope(data=data)


@router.post("/train", response_model=Envelope)
def train_model(background_tasks: BackgroundTasks, _user=Depends(get_current_user)):
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {
        "job_id":       job_id,
        "status":       "pending",
        "progress_pct": 0.0,
        "message":      "Training queued…",
        "started_at":   datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "metrics":      None,
    }

    def _run():
        _jobs[job_id]["status"] = "running"

        def cb(pct, msg):
            _jobs[job_id]["progress_pct"] = round(pct * 100, 1)
            _jobs[job_id]["message"] = msg

        try:
            from app.services.training_service import train_all_models
            from app.services.clv_service import invalidate_predictions
            from app.services.segmentation import invalidate_enriched
            from app.services.churn_service import invalidate_churn
            from app.services.shap_service import invalidate_shap
            from app.services.forecast_service import invalidate_forecast
            from app.services.cohort_service import invalidate_cohorts

            result = train_all_models(progress_cb=cb)

            # Invalidate all downstream caches
            invalidate_predictions()
            invalidate_enriched()
            invalidate_churn()
            invalidate_shap()
            invalidate_forecast()
            invalidate_cohorts()

            # Re-run predictions eagerly
            from app.services.churn_service import get_churn_predictions
            get_churn_predictions()

            _jobs[job_id]["status"] = "completed"
            _jobs[job_id]["progress_pct"] = 100.0
            _jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
            _jobs[job_id]["metrics"] = result

        except Exception as e:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["message"] = f"Training failed: {str(e)}"

    background_tasks.add_task(_run)
    return Envelope(data={"job_id": job_id, "status": "pending"}, message="Training started in background")


@router.post("/retrain", response_model=Envelope)
def retrain_model(background_tasks: BackgroundTasks, _user=Depends(get_current_user)):
    """Alias for /train — triggers a fresh training run."""
    return train_model(background_tasks, _user)


@router.get("/training-status", response_model=Envelope)
def training_status(job_id: str = None, _user=Depends(get_current_user)):
    if job_id and job_id in _jobs:
        return Envelope(data=_jobs[job_id])
    # Return most recent job
    if _jobs:
        latest = max(_jobs.values(), key=lambda j: j["started_at"])
        return Envelope(data=latest)
    return Envelope(data=None, message="No training jobs found")
