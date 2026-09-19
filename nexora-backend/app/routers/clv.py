"""CLV summary, distribution, segments, and top customers router."""
from fastapi import APIRouter, Depends, Query
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/clv", tags=["clv"])


@router.get("/summary", response_model=Envelope)
def clv_summary(_user=Depends(get_current_user)):
    from app.services.segmentation import get_enriched_df
    from app.services.training_service import get_model_metrics

    df = get_enriched_df()
    metrics = get_model_metrics() or {}

    clv = df["predicted_clv"]
    hv_threshold = clv.quantile(0.85)
    declining = df[df["clv_trajectory"] == "Declining"]

    return Envelope(data={
        "total_predicted_clv": round(float(clv.sum()), 2),
        "avg_clv":             round(float(clv.mean()), 2),
        "median_clv":          round(float(clv.median()), 2),
        "total_current_mrr":   round(float(df["current_mrr"].sum()), 2),
        "current_arr":         round(float(df["current_mrr"].sum() * 12), 2),
        "high_value_count":    int((clv >= hv_threshold).sum()),
        "declining_count":     int(len(declining)),
        "clv_growth_estimate": round(float(df["mrr_growth_first3_to_last3"].mean() * 100), 2),
        "model_version":       metrics.get("model_version", "not_trained"),
        "clv_horizon_months":  metrics.get("clv_horizon_months", 12),
        "model_r2":            metrics.get("r2", None),
        "model_mae":           metrics.get("mae", None),
        "model_name":          metrics.get("model_name", None),
        "target_definition":   "12-month future revenue-based CLV (clv_target_12m_revenue_based)",
        "data_note":           "Synthetic Kaggle SaaS dataset — not real-world customer data",
    })


@router.get("/distribution", response_model=Envelope)
def clv_distribution(bins: int = Query(10, ge=4, le=20), _user=Depends(get_current_user)):
    from app.services.segmentation import get_clv_distribution
    return Envelope(data=get_clv_distribution(bins=bins))


@router.get("/segments", response_model=Envelope)
def clv_segments(_user=Depends(get_current_user)):
    from app.services.segmentation import get_segment_summary
    return Envelope(data=get_segment_summary())


@router.get("/top-customers", response_model=Envelope)
def top_customers(n: int = Query(10, ge=1, le=100), _user=Depends(get_current_user)):
    from app.services.churn_service import get_churn_predictions
    df = get_churn_predictions()
    top = df.nlargest(n, "predicted_clv")
    records = []
    for _, r in top.iterrows():
        records.append({
            "account_id":        int(r["account_id"]),
            "industry":          r["industry"],
            "company_size":      r["company_size"],
            "current_mrr":       round(float(r["current_mrr"]), 2),
            "predicted_clv":     round(float(r["predicted_clv"]), 2),
            "clv_segment":       r["clv_segment"],
            "clv_trajectory":    r["clv_trajectory"],
            "health_score":      round(float(r["health_score"]), 1),
            "churn_probability": round(float(r["churn_probability"]), 4),
        })
    return Envelope(data=records)
