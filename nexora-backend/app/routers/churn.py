"""Churn summary and high-risk customers router (secondary capability)."""
from fastapi import APIRouter, Depends, Query
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/churn", tags=["churn"])


@router.get("/summary", response_model=Envelope)
def churn_summary(_user=Depends(get_current_user)):
    from app.services.churn_service import get_churn_summary
    return Envelope(data=get_churn_summary())


@router.get("/high-risk", response_model=Envelope)
def high_risk_customers(
    threshold: float = Query(0.6, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    _user=Depends(get_current_user),
):
    from app.services.churn_service import get_churn_predictions
    df = get_churn_predictions()
    hr = df[df["churn_probability"] >= threshold].nlargest(limit, "predicted_clv")
    records = []
    for _, r in hr.iterrows():
        records.append({
            "account_id":        int(r["account_id"]),
            "industry":          r["industry"],
            "company_size":      r["company_size"],
            "predicted_clv":     round(float(r["predicted_clv"]), 2),
            "churn_probability": round(float(r["churn_probability"]), 4),
            "churn_risk_level":  r["churn_risk_level"],
            "health_score":      round(float(r["health_score"]), 1),
            "current_mrr":       round(float(r["current_mrr"]), 2),
            "clv_segment":       r["clv_segment"],
        })
    return Envelope(data=records, meta={"threshold": threshold, "returned": len(records)})
