"""
Customers router — server-side paginated, filtered, sorted customer list.
Supports up to 50,000 accounts without loading all to browser.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from math import ceil

from app.models.schemas import Envelope, Meta
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _get_df():
    from app.services.churn_service import get_churn_predictions
    return get_churn_predictions()


@router.get("", response_model=Envelope)
def list_customers(
    search:       Optional[str]   = Query(None, description="Search by account_id, company, or industry"),
    industry:     Optional[str]   = Query(None),
    company_size: Optional[str]  = Query(None),
    tier:         Optional[str]   = Query(None),
    segment:      Optional[str]   = Query(None),
    clv_segment:  Optional[str]   = Query(None),
    min_clv:      Optional[float] = Query(None),
    max_clv:      Optional[float] = Query(None),
    min_mrr:      Optional[float] = Query(None),
    max_mrr:      Optional[float] = Query(None),
    min_health:   Optional[float] = Query(None),
    max_health:   Optional[float] = Query(None),
    min_churn:    Optional[float] = Query(None),
    max_churn:    Optional[float] = Query(None),
    trajectory:   Optional[str]   = Query(None),
    clv_trajectory: Optional[str] = Query(None),
    sort:         Optional[str]   = Query(None),
    sort_by:      Optional[str]   = Query(None),
    order:        Optional[str]   = Query(None),
    sort_desc:    Optional[bool]  = Query(None),
    page:         int              = Query(1, ge=1),
    page_size:    int              = Query(20, ge=1, le=200),
    _user=Depends(get_current_user),
):
    df = _get_df().copy()

    # ── Map Aliases ─────────────────────────────────────────────
    target_segment = clv_segment or segment
    target_tier = tier or company_size
    target_trajectory = clv_trajectory or trajectory
    target_sort = sort_by or sort or "predicted_clv"

    # Map sort column name to actual dataframe column
    sort_column_map = {
        "customer_id": "account_id",
        "account_name": "company_size",
        "tier": "company_size",
        "historical_mrr": "current_mrr",
        "mrr": "current_mrr",
        "predicted_clv": "predicted_clv",
        "clv": "predicted_clv",
        "clv_trajectory_pct": "mrr_growth_first3_to_last3",
        "health_score": "health_score",
        "health": "health_score",
        "churn_probability": "churn_probability",
        "churn_risk": "churn_probability",
        "historical_tenure_months": "historical_tenure_months",
        "tenure": "historical_tenure_months",
    }
    actual_sort_col = sort_column_map.get(target_sort, "predicted_clv")

    # ── Filters ─────────────────────────────────────────────────
    if search:
        s = search.lower()
        df = df[
            df["account_id"].astype(str).str.contains(s) |
            df["industry"].astype(str).str.lower().str.contains(s) |
            df["company_size"].astype(str).str.lower().str.contains(s)
        ]
    if industry and industry != "All":
        df = df[df["industry"].str.lower() == industry.lower()]
    if target_tier and target_tier != "All":
        df = df[df["company_size"].str.lower() == target_tier.lower()]
    if target_segment and target_segment != "All":
        ts_lower = target_segment.lower()
        if ts_lower == "at risk":
            df = df[(df["clv_segment"] == "Declining Value") | (df["churn_probability"] > 0.35)]
        elif ts_lower in ["mid value", "mid-value", "mid"]:
            df = df[df["clv_segment"].isin(["Stable Value", "Growth Opportunity", "Developing", "Mid Value"])]
        elif ts_lower in ["low value", "low-value", "low"]:
            df = df[df["clv_segment"].isin(["Low Value", "Developing"])]
        else:
            df = df[df["clv_segment"].str.lower().str.contains(ts_lower)]
    if target_trajectory and target_trajectory != "All":
        df = df[df["clv_trajectory"].str.lower() == target_trajectory.lower()]
    if min_clv is not None:
        df = df[df["predicted_clv"] >= min_clv]
    if max_clv is not None:
        df = df[df["predicted_clv"] <= max_clv]
    if min_mrr is not None:
        df = df[df["current_mrr"] >= min_mrr]
    if max_mrr is not None:
        df = df[df["current_mrr"] <= max_mrr]
    if min_health is not None:
        df = df[df["health_score"] >= min_health]
    if max_health is not None:
        df = df[df["health_score"] <= max_health]
    if min_churn is not None:
        df = df[df["churn_probability"] >= min_churn]
    if max_churn is not None:
        df = df[df["churn_probability"] <= max_churn]

    # ── Sort ────────────────────────────────────────────────────
    ascending = False
    if sort_desc is not None:
        ascending = not sort_desc
    elif order is not None:
        ascending = (order.lower() == "asc")

    if actual_sort_col in df.columns:
        df = df.sort_values(actual_sort_col, ascending=ascending)

    # ── Paginate ────────────────────────────────────────────────
    total = len(df)
    total_pages = ceil(total / page_size) if total > 0 else 1
    start = (page - 1) * page_size
    page_df = df.iloc[start: start + page_size]

    # ── Serialize with dual key support ──────────────────────────
    records = []
    for _, row in page_df.iterrows():
        acc_id = str(row["account_id"])
        company_name = f"Account-{acc_id} ({row['company_size']})"
        growth_pct = round(float(row["mrr_growth_first3_to_last3"]) * 100, 1)

        records.append({
            # Primary frontend expected keys
            "customer_id":             acc_id,
            "account_id":              int(row["account_id"]),
            "account_name":            company_name,
            "company":                 company_name,
            "industry":                row["industry"],
            "tier":                    row["company_size"],
            "company_size":            row["company_size"],
            "contract_type":           row["contract_type"],
            "regime_state":            row["regime_state"],
            "historical_mrr":          round(float(row["current_mrr"]), 2),
            "current_mrr":             round(float(row["current_mrr"]), 2),
            "clv_target_12m_revenue_based": round(float(row["clv_target_12m_revenue_based"]), 2) if "clv_target_12m_revenue_based" in row else round(float(row["predicted_clv"]), 2),
            "predicted_clv":           round(float(row["predicted_clv"]), 2),
            "clv_segment":             row["clv_segment"],
            "clv_trajectory":          row["clv_trajectory"],
            "clv_trajectory_pct":      growth_pct,
            "health_score":            round(float(row["health_score"]), 1),
            "churn_probability":       round(float(row["churn_probability"]), 4),
            "churn_risk_level":        row["churn_risk_level"],
            "historical_tenure_months": round(float(row["historical_tenure_months"]), 1),
            "tenure_months":           round(float(row["historical_tenure_months"]), 1),
            "feature_adoption_rate":   round(float(row["current_feature_adoption_rate"]), 4),
            "active_users_count":      round(float(row["current_active_users"]), 1),
            "active_users":            round(float(row["current_active_users"]), 1),
            "payment_delay_rate":      round(float(row["payment_delay_rate"]), 4),
            "support_tickets_30d":     int(row["current_tickets_count"]) if "current_tickets_count" in row else 2,
        })

    return Envelope(
        data={"items": records, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages},
        meta=Meta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )



@router.get("/{account_id}", response_model=Envelope)
def get_customer(account_id: int, _user=Depends(get_current_user)):
    df = _get_df()
    row = df[df["account_id"] == account_id]
    if len(row) == 0:
        raise HTTPException(status_code=404, detail=f"Customer {account_id} not found")
    r = row.iloc[0]

    # Attach SHAP explanation
    from app.services.shap_service import get_local_explanation
    shap_exp = get_local_explanation(account_id)

    # Recommendations
    recommendations = _build_recommendations(r)

    return Envelope(data={
        "account_id":             int(r["account_id"]),
        "industry":               r["industry"],
        "company_size":           r["company_size"],
        "contract_type":          r["contract_type"],
        "regime_state":           r["regime_state"],
        "current_mrr":            round(float(r["current_mrr"]), 2),
        "predicted_clv":          round(float(r["predicted_clv"]), 2),
        "clv_segment":            r["clv_segment"],
        "clv_trajectory":         r["clv_trajectory"],
        "health_score":           round(float(r["health_score"]), 1),
        "churn_probability":      round(float(r["churn_probability"]), 4),
        "churn_risk_level":       r["churn_risk_level"],
        "tenure_months":          round(float(r["historical_tenure_months"]), 1),
        "feature_adoption_rate":  round(float(r["current_feature_adoption_rate"]), 4),
        "active_users":           round(float(r["current_active_users"]), 1),
        "payment_delay_rate":     round(float(r["payment_delay_rate"]), 4),
        "hist_mrr_mean":          round(float(r["hist_mrr_mean"]), 2),
        "hist_mrr_max":           round(float(r["hist_mrr_max"]), 2),
        "hist_mrr_std":           round(float(r["hist_mrr_std"]), 2),
        "mrr_growth":             round(float(r["mrr_growth_first3_to_last3"]), 4),
        "recent_mrr_mean":        round(float(r["recent_3m_mrr_mean"]), 2),
        "usage_growth":           round(float(r["current_usage_growth"]), 4),
        "ticket_count":           round(float(r["current_tickets_count"]), 1),
        "ticket_growth":          round(float(r["current_ticket_growth"]), 4),
        "discount_pct":           round(float(r["discount_pct"]), 4),
        "shap_explanation":       shap_exp,
        "recommendations":        recommendations,
    })


def _build_recommendations(r) -> list[dict]:
    """Generate action recommendations from actual customer metrics."""
    recs = []
    churn = float(r["churn_probability"])
    clv   = float(r["predicted_clv"])
    adopt = float(r["current_feature_adoption_rate"])
    traj  = r["clv_trajectory"]
    pay   = float(r["payment_delay_rate"])
    mrr_g = float(r["mrr_growth_first3_to_last3"])

    if churn > 0.6 and clv > 5000:
        recs.append({
            "priority":        "Critical",
            "action":          "Retention Intervention",
            "reason":          f"High churn probability ({churn:.0%}) with significant CLV at risk",
            "suggested_steps": "Schedule immediate customer success call. Review recent support tickets.",
            "metrics":         {"churn_probability": churn, "predicted_clv": clv},
        })
    if adopt < 0.3:
        recs.append({
            "priority":        "High",
            "action":          "Adoption Improvement",
            "reason":          f"Feature adoption rate is low ({adopt:.0%})",
            "suggested_steps": "Schedule product training. Share adoption guides. Assign CSM.",
            "metrics":         {"feature_adoption_rate": adopt},
        })
    if traj == "Increasing" and mrr_g > 0.10:
        recs.append({
            "priority":        "Medium",
            "action":          "Upsell / Expansion",
            "reason":          f"MRR growing strongly ({mrr_g:.0%}). Expansion opportunity.",
            "suggested_steps": "Present premium tier or add-on modules during next QBR.",
            "metrics":         {"mrr_growth": mrr_g},
        })
    if pay > 0.3:
        recs.append({
            "priority":        "High",
            "action":          "Payment Risk Follow-up",
            "reason":          f"High payment delay rate ({pay:.0%})",
            "suggested_steps": "Alert finance team. Review payment terms. Set up auto-pay.",
            "metrics":         {"payment_delay_rate": pay},
        })
    if not recs:
        recs.append({
            "priority":        "Low",
            "action":          "Maintain Relationship",
            "reason":          "Customer metrics are within healthy ranges",
            "suggested_steps": "Schedule quarterly business review. Monitor for changes.",
            "metrics":         {},
        })
    return recs


@router.get("/{account_id}/clv", response_model=Envelope)
def get_customer_clv(account_id: int, _user=Depends(get_current_user)):
    df = _get_df()
    row = df[df["account_id"] == account_id]
    if len(row) == 0:
        raise HTTPException(404, f"Customer {account_id} not found")
    r = row.iloc[0]
    return Envelope(data={
        "account_id":     int(r["account_id"]),
        "predicted_clv":  round(float(r["predicted_clv"]), 2),
        "clv_segment":    r["clv_segment"],
        "clv_trajectory": r["clv_trajectory"],
        "current_mrr":    round(float(r["current_mrr"]), 2),
        "mrr_growth":     round(float(r["mrr_growth_first3_to_last3"]), 4),
        "uncertainty":    {
            "available": False,
            "note": "Point prediction only. Prediction interval requires quantile regression or conformal prediction — not implemented in current model version.",
        },
    })


@router.get("/{account_id}/explanation", response_model=Envelope)
def get_customer_explanation(account_id: int, _user=Depends(get_current_user)):
    from app.services.shap_service import get_local_explanation
    return Envelope(data=get_local_explanation(account_id))


@router.get("/{account_id}/timeline", response_model=Envelope)
def get_customer_timeline(account_id: int, _user=Depends(get_current_user)):
    """
    Synthetic lifecycle events derived from actual customer metrics.
    Labeled as derived/synthetic — not actual event logs.
    """
    df = _get_df()
    row = df[df["account_id"] == account_id]
    if len(row) == 0:
        raise HTTPException(404, f"Customer {account_id} not found")
    r = row.iloc[0]

    events = []
    tenure = float(r["historical_tenure_months"])
    if tenure >= 1:
        events.append({"month_offset": -int(tenure), "event": "Account Activation", "type": "success"})
    if r["mrr_growth_first3_to_last3"] > 0.05:
        events.append({"month_offset": -3, "event": "MRR Growth Trend Detected", "type": "upgrade"})
    if float(r["payment_delay_rate"]) > 0.2:
        events.append({"month_offset": -2, "event": "Payment Delay Signal", "type": "warning"})
    if float(r["current_feature_adoption_rate"]) > 0.7:
        events.append({"month_offset": -1, "event": "High Feature Adoption", "type": "success"})

    return Envelope(data={
        "account_id": int(r["account_id"]),
        "events":     events,
        "note":       "Events derived from behavioral signals — not actual event log data",
    })


@router.get("/{account_id}/progress", response_model=Envelope)
def get_customer_progress(account_id: int, _user=Depends(get_current_user)):
    """
    Individual Customer Progress Analysis.

    Derives historical-style time-series from available aggregate metrics:
      - MRR progression (synthesized from hist_mrr_mean, recent_3m_mrr_mean, current_mrr)
      - CLV progression (synthesized from baseline growth + predicted endpoint)
      - Health score trend (synthesized from behavioral signal ratios)
      - Adoption trend (current_feature_adoption_rate + adoption_trend)
      - Churn risk trend (stable baseline → current probability)
      - Support & payment signals
      - Benchmarks vs portfolio average

    All data is derived from real model features. Labeled synthetic where applicable.
    """
    import math

    df = _get_df()
    row = df[df["account_id"] == account_id]
    if len(row) == 0:
        raise HTTPException(404, f"Customer {account_id} not found")
    r = row.iloc[0]

    # ── Core metrics ────────────────────────────────────────
    tenure    = max(float(r["historical_tenure_months"]), 6)
    curr_mrr  = float(r["current_mrr"])
    hist_mean = float(r["hist_mrr_mean"])
    hist_max  = float(r["hist_mrr_max"])
    hist_std  = float(r["hist_mrr_std"])
    recent_mrr = float(r["recent_3m_mrr_mean"])
    mrr_growth = float(r["mrr_growth_first3_to_last3"])
    pred_clv  = float(r["predicted_clv"])
    health    = float(r["health_score"])
    adoption  = float(r["current_feature_adoption_rate"])
    adopt_trend = float(r.get("adoption_trend_first3_to_last3", 0))
    usage_growth = float(r["current_usage_growth"])
    churn_prob  = float(r["churn_probability"])
    pay_delay   = float(r["payment_delay_rate"])
    tickets     = float(r["current_tickets_count"]) if "current_tickets_count" in r.index else 2
    ticket_growth = float(r["current_ticket_growth"])
    error_rate  = float(r.get("current_error_rate", 0.05))
    discount    = float(r["discount_pct"])
    clv_traj    = r["clv_trajectory"]
    regime      = r["regime_state"]

    # ── Portfolio benchmarks (derived from entire df) ───────
    portfolio_avg_health = round(float(df["health_score"].mean()), 1)
    portfolio_avg_churn  = round(float(df["churn_probability"].mean()), 4)
    portfolio_avg_adoption = round(float(df["current_feature_adoption_rate"].mean()), 4)
    portfolio_avg_mrr    = round(float(df["current_mrr"].mean()), 2)
    portfolio_avg_clv    = round(float(df["predicted_clv"].mean()), 2)

    # ── Synthesize 6-point MRR time series ──────────────────
    # Use hist_mean as early baseline, recent_3m_mrr_mean as mid, current_mrr as latest
    # Interpolate a smooth 6-point curve
    early_mrr = hist_mean - hist_std * 0.4
    def _interp(a, b, t): return round(a + (b - a) * t + (hist_std * 0.1 * math.sin(t * math.pi)), 2)

    mrr_series = [
        {"period": "M-6", "mrr": round(max(early_mrr, curr_mrr * 0.7), 2)},
        {"period": "M-5", "mrr": _interp(early_mrr, hist_mean, 0.2)},
        {"period": "M-4", "mrr": _interp(early_mrr, hist_mean, 0.45)},
        {"period": "M-3", "mrr": round(recent_mrr * 0.97, 2)},
        {"period": "M-2", "mrr": round(recent_mrr, 2)},
        {"period": "Current", "mrr": round(curr_mrr, 2)},
    ]

    # ── CLV progression (6 points: derived from tenure baseline → predicted) ─
    # Back-calculate from predicted CLV using growth rate
    monthly_growth = mrr_growth / 12 if mrr_growth != 0 else 0.005
    early_clv = pred_clv / ((1 + monthly_growth) ** 6)
    clv_series = []
    for i, label in enumerate(["M-6", "M-5", "M-4", "M-3", "M-2", "Current"]):
        factor = (1 + monthly_growth) ** i
        clv_series.append({"period": label, "clv": round(early_clv * factor, 2)})

    # ── Health score trend (6 points) ───────────────────────
    health_improvement = (usage_growth * 0.25 + adopt_trend * 0.40) * 100
    early_health = max(0, min(100, health - health_improvement * 0.8))
    health_series = [
        {"period": "M-6",     "health": round(max(0, min(100, early_health)), 1)},
        {"period": "M-5",     "health": round(max(0, min(100, early_health + health_improvement * 0.15)), 1)},
        {"period": "M-4",     "health": round(max(0, min(100, early_health + health_improvement * 0.32)), 1)},
        {"period": "M-3",     "health": round(max(0, min(100, early_health + health_improvement * 0.52)), 1)},
        {"period": "M-2",     "health": round(max(0, min(100, early_health + health_improvement * 0.75)), 1)},
        {"period": "Current", "health": round(health, 1)},
    ]

    # ── Adoption trend ───────────────────────────────────────
    early_adopt = max(0.0, min(1.0, adoption - adopt_trend * 0.8))
    adoption_series = [
        {"period": "M-6",     "adoption": round(max(0, min(1, early_adopt)) * 100, 1)},
        {"period": "M-5",     "adoption": round(max(0, min(1, early_adopt + adopt_trend * 0.15)) * 100, 1)},
        {"period": "M-4",     "adoption": round(max(0, min(1, early_adopt + adopt_trend * 0.35)) * 100, 1)},
        {"period": "M-3",     "adoption": round(max(0, min(1, early_adopt + adopt_trend * 0.55)) * 100, 1)},
        {"period": "M-2",     "adoption": round(max(0, min(1, early_adopt + adopt_trend * 0.75)) * 100, 1)},
        {"period": "Current", "adoption": round(adoption * 100, 1)},
    ]

    # ── Churn risk trend ─────────────────────────────────────
    early_churn = max(0.0, min(1.0, churn_prob - (ticket_growth + pay_delay * 0.1) * 0.3))
    churn_series = [
        {"period": "M-6",     "churn_pct": round(max(0, early_churn * 0.85) * 100, 1)},
        {"period": "M-5",     "churn_pct": round(max(0, early_churn * 0.90) * 100, 1)},
        {"period": "M-4",     "churn_pct": round(max(0, early_churn * 0.94) * 100, 1)},
        {"period": "M-3",     "churn_pct": round(max(0, early_churn * 0.97) * 100, 1)},
        {"period": "M-2",     "churn_pct": round(max(0, (early_churn + churn_prob) / 2) * 100, 1)},
        {"period": "Current", "churn_pct": round(churn_prob * 100, 1)},
    ]

    # ── Score cards ──────────────────────────────────────────
    mrr_change_pct = round(mrr_growth * 100, 1)
    clv_change_pct = round(mrr_growth * 100 * 1.2, 1)
    health_change  = round(health - early_health, 1)
    adopt_change   = round((adoption - early_adopt) * 100, 1)

    # ── Milestones derived from thresholds ──────────────────
    milestones = []
    if tenure >= 12:
        milestones.append({"label": "1-Year Anniversary", "achieved": True, "icon": "trophy"})
    if tenure >= 24:
        milestones.append({"label": "2-Year Loyalty", "achieved": True, "icon": "star"})
    if adoption >= 0.7:
        milestones.append({"label": "Power User", "achieved": True, "icon": "zap"})
    if churn_prob < 0.2:
        milestones.append({"label": "Low Churn Risk", "achieved": True, "icon": "shield"})
    if mrr_growth > 0.1:
        milestones.append({"label": "Revenue Growth Champion", "achieved": True, "icon": "trending-up"})
    if pay_delay < 0.05:
        milestones.append({"label": "Excellent Payment Record", "achieved": True, "icon": "check-circle"})
    if pay_delay > 0.3:
        milestones.append({"label": "Payment Risk Alert", "achieved": False, "icon": "alert-triangle"})
    if error_rate > 0.15:
        milestones.append({"label": "High Error Rate — Needs Attention", "achieved": False, "icon": "x-circle"})
    if pred_clv > portfolio_avg_clv:
        milestones.append({"label": "Above-Average Portfolio CLV", "achieved": True, "icon": "arrow-up"})

    # ── Signal cards ─────────────────────────────────────────
    signals = [
        {
            "label":  "MRR Momentum",
            "value":  f"{mrr_change_pct:+.1f}%",
            "detail": f"6-month MRR trend: {'Growing' if mrr_growth > 0.05 else 'Stable' if mrr_growth >= -0.05 else 'Declining'}",
            "status": "positive" if mrr_growth > 0.05 else "neutral" if mrr_growth >= -0.05 else "negative",
        },
        {
            "label":  "Feature Adoption",
            "value":  f"{adoption * 100:.0f}%",
            "detail": f"Trend: {adopt_change:+.1f}pp vs 6m ago. Portfolio avg: {portfolio_avg_adoption * 100:.0f}%",
            "status": "positive" if adoption >= 0.6 else "neutral" if adoption >= 0.35 else "negative",
        },
        {
            "label":  "Churn Risk",
            "value":  f"{churn_prob * 100:.1f}%",
            "detail": r["churn_risk_level"] + f". Portfolio avg: {portfolio_avg_churn * 100:.1f}%",
            "status": "positive" if churn_prob < 0.25 else "neutral" if churn_prob < 0.5 else "negative",
        },
        {
            "label":  "Health Score",
            "value":  f"{health:.0f}",
            "detail": f"Change: {health_change:+.1f} vs 6m ago. Portfolio avg: {portfolio_avg_health}",
            "status": "positive" if health >= 70 else "neutral" if health >= 50 else "negative",
        },
        {
            "label":  "Support Load",
            "value":  f"{int(tickets)} tickets",
            "detail": f"Growth: {ticket_growth * 100:+.0f}%. Error rate: {error_rate * 100:.1f}%",
            "status": "negative" if ticket_growth > 0.2 or tickets > 10 else "neutral" if tickets > 5 else "positive",
        },
        {
            "label":  "Payment Behavior",
            "value":  f"{pay_delay * 100:.0f}% delay rate",
            "detail": f"Discount applied: {discount * 100:.0f}%. Contract: {r['contract_type']}",
            "status": "positive" if pay_delay < 0.1 else "neutral" if pay_delay < 0.25 else "negative",
        },
    ]

    return Envelope(data={
        "account_id":   int(r["account_id"]),
        "account_name": f"Account-{int(r['account_id'])} ({r['company_size']})",
        "industry":     r["industry"],
        "tier":         r["company_size"],
        "regime_state": regime,
        "clv_segment":  r["clv_segment"],
        "clv_trajectory": clv_traj,
        "tenure_months":  round(tenure, 1),

        # Current snapshot
        "current": {
            "mrr":         round(curr_mrr, 2),
            "predicted_clv": round(pred_clv, 2),
            "health_score":  round(health, 1),
            "churn_probability": round(churn_prob, 4),
            "feature_adoption": round(adoption, 4),
            "active_users": round(float(r["current_active_users"]), 1),
        },

        # Portfolio benchmarks
        "benchmarks": {
            "avg_mrr":     portfolio_avg_mrr,
            "avg_clv":     portfolio_avg_clv,
            "avg_health":  portfolio_avg_health,
            "avg_churn":   portfolio_avg_churn,
            "avg_adoption": portfolio_avg_adoption,
        },

        # Change summary vs 6m ago (derived)
        "changes": {
            "mrr_pct":      mrr_change_pct,
            "clv_pct":      clv_change_pct,
            "health_delta": health_change,
            "adoption_delta_pp": adopt_change,
        },

        # Time series
        "mrr_series":     mrr_series,
        "clv_series":     clv_series,
        "health_series":  health_series,
        "adoption_series": adoption_series,
        "churn_series":   churn_series,

        # Rich signals
        "signals":    signals,
        "milestones": milestones,

        "note": "Progress trends are derived from aggregate dataset signals (mrr_growth, adoption_trend, etc.), not individual time-series logs.",
    })
