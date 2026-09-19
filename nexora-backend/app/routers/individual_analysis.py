"""
Individual Analysis Router — deep per-customer analytics.
Aggregates: SHAP local explanation, AI recommendations,
CLV breakdown, payment behaviour, risk profile, and timeline events.
"""
from fastapi import APIRouter, Depends, HTTPException
import math

from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/individual-analysis", tags=["individual-analysis"])


def _get_df():
    from app.services.churn_service import get_churn_predictions
    return get_churn_predictions()


# ── Priority colour map (for frontend badge rendering) ─────────────────────
_PRIORITY_COLOR = {
    "Critical": "#ef4444",
    "High":     "#f59e0b",
    "Medium":   "#3b82f6",
    "Low":      "#10b981",
}


def _build_recommendations(r) -> list[dict]:
    recs = []
    churn = float(r["churn_probability"])
    clv   = float(r["predicted_clv"])
    adopt = float(r["current_feature_adoption_rate"])
    traj  = r["clv_trajectory"]
    pay   = float(r["payment_delay_rate"])
    mrr_g = float(r["mrr_growth_first3_to_last3"])
    health = float(r["health_score"])
    tickets = float(r.get("current_tickets_count", 2))
    ticket_growth = float(r["current_ticket_growth"])

    if churn > 0.6 and clv > 5000:
        recs.append({
            "priority": "Critical",
            "color":    _PRIORITY_COLOR["Critical"],
            "action":   "Retention Intervention",
            "reason":   f"Churn probability {churn:.0%} — high-value account at risk",
            "steps":    [
                "Schedule an immediate customer success call within 24h",
                "Review all open support tickets and blockers",
                "Offer a custom retention package or SLA upgrade",
            ],
            "impact":   f"Prevents ₹{clv:,.0f} CLV loss",
        })
    elif churn > 0.4:
        recs.append({
            "priority": "High",
            "color":    _PRIORITY_COLOR["High"],
            "action":   "Churn Risk Mitigation",
            "reason":   f"Elevated churn probability of {churn:.0%}",
            "steps":    [
                "Assign a dedicated CSM",
                "Conduct a health check call this week",
                "Identify pain points from recent tickets",
            ],
            "impact":   f"Reduces churn risk on ₹{clv:,.0f} account",
        })

    if adopt < 0.3:
        recs.append({
            "priority": "High",
            "color":    _PRIORITY_COLOR["High"],
            "action":   "Adoption Improvement",
            "reason":   f"Feature adoption {adopt:.0%} — well below 60% benchmark",
            "steps":    [
                "Schedule a product onboarding session",
                "Share tailored feature guides and use-case videos",
                "Set up in-app adoption nudges via CSM",
            ],
            "impact":   "Low adoption correlates strongly with churn risk",
        })
    elif adopt < 0.55:
        recs.append({
            "priority": "Medium",
            "color":    _PRIORITY_COLOR["Medium"],
            "action":   "Feature Engagement Boost",
            "reason":   f"Adoption at {adopt:.0%} — room to grow",
            "steps":[
                "Highlight 3 high-value unused features in next QBR",
                "Share industry benchmark adoption stats",
            ],
            "impact":   "Improving adoption by 20pp typically increases retention by 15%",
        })

    if traj == "Increasing" and mrr_g > 0.10:
        recs.append({
            "priority": "Medium",
            "color":    _PRIORITY_COLOR["Medium"],
            "action":   "Upsell / Expansion",
            "reason":   f"MRR growing at {mrr_g:.0%} — clear expansion signal",
            "steps":    [
                "Present premium tier or seat expansion at next touchpoint",
                "Offer a multi-year contract with incentive pricing",
                "Introduce add-on modules aligned to their use case",
            ],
            "impact":   "Revenue expansion on a healthy, growing account",
        })

    if pay > 0.3:
        recs.append({
            "priority": "High",
            "color":    _PRIORITY_COLOR["High"],
            "action":   "Payment Risk Follow-up",
            "reason":   f"Payment delay rate {pay:.0%} exceeds 30% threshold",
            "steps":    [
                "Alert finance & AR team immediately",
                "Review and renegotiate payment terms",
                "Set up auto-pay and send payment reminders",
            ],
            "impact":   "Reduces bad-debt exposure and stabilises cash flow",
        })

    if ticket_growth > 0.3 or tickets > 12:
        recs.append({
            "priority": "High",
            "color":    _PRIORITY_COLOR["High"],
            "action":   "Support Overload Resolution",
            "reason":   f"{int(tickets)} tickets with {ticket_growth:.0%} growth trend",
            "steps":    [
                "Escalate top blockers to engineering",
                "Assign senior support rep to the account",
                "Review recurring ticket categories for systemic issues",
            ],
            "impact":   "High ticket volume is a leading indicator of churn",
        })

    if health < 50:
        recs.append({
            "priority": "High",
            "color":    _PRIORITY_COLOR["High"],
            "action":   "Health Score Recovery",
            "reason":   f"Health score {health:.0f}/100 — in critical zone",
            "steps":    [
                "Run a full health diagnostic with the CSM",
                "Identify top 3 health-impacting factors",
                "Set a 90-day recovery plan with measurable targets",
            ],
            "impact":   "Customers with health < 50 churn at 3× the base rate",
        })

    if not recs:
        recs.append({
            "priority": "Low",
            "color":    _PRIORITY_COLOR["Low"],
            "action":   "Maintain Relationship",
            "reason":   "All metrics within healthy ranges",
            "steps":    [
                "Schedule quarterly business review",
                "Explore expansion opportunities",
                "Continue monitoring for metric drift",
            ],
            "impact":   "Sustain current healthy trajectory",
        })
    return recs


def _clv_breakdown(r, pred_clv: float, avg_clv: float) -> dict:
    """Decompose CLV estimate into constituent revenue drivers."""
    mrr = float(r["current_mrr"])
    tenure = max(float(r["historical_tenure_months"]), 1)
    mrr_growth = float(r["mrr_growth_first3_to_last3"])
    adopt = float(r["current_feature_adoption_rate"])
    churn = float(r["churn_probability"])
    discount = float(r["discount_pct"])

    # Revenue base
    base_revenue   = round(mrr * 12, 2)
    growth_premium = round(mrr * 12 * max(mrr_growth, 0) * 0.5, 2)
    retention_value = round(pred_clv * (1 - churn) * 0.15, 2)
    expansion_potential = round(base_revenue * adopt * 0.3, 2)
    discount_drag  = round(base_revenue * discount, 2)

    components = [
        {"label": "Base Annual Revenue",     "value": base_revenue,       "color": "#5b5ff1", "pct": 0},
        {"label": "Growth Premium",          "value": growth_premium,     "color": "#10b981", "pct": 0},
        {"label": "Retention Value",         "value": retention_value,    "color": "#3b82f6", "pct": 0},
        {"label": "Expansion Potential",     "value": expansion_potential,"color": "#7c3aed", "pct": 0},
        {"label": "Discount Drag (negative)","value": -discount_drag,     "color": "#ef4444", "pct": 0},
    ]
    total_positive = sum(c["value"] for c in components if c["value"] > 0)
    for c in components:
        c["pct"] = round(abs(c["value"]) / max(total_positive, 1) * 100, 1)

    return {
        "predicted_clv":    round(pred_clv, 2),
        "portfolio_avg_clv": round(avg_clv, 2),
        "vs_avg_pct":       round((pred_clv - avg_clv) / max(avg_clv, 1) * 100, 1),
        "components":       components,
        "annual_run_rate":  round(base_revenue, 2),
        "lifetime_months":  round(tenure, 1),
    }


def _payment_profile(r) -> dict:
    pay = float(r["payment_delay_rate"])
    discount = float(r["discount_pct"])
    contract = r["contract_type"]

    if pay < 0.05:
        rating = "Excellent"; rating_color = "#10b981"; risk_level = "Very Low"
    elif pay < 0.15:
        rating = "Good";      rating_color = "#3b82f6"; risk_level = "Low"
    elif pay < 0.30:
        rating = "Fair";      rating_color = "#f59e0b"; risk_level = "Medium"
    else:
        rating = "Poor";      rating_color = "#ef4444"; risk_level = "High"

    return {
        "delay_rate":     round(pay, 4),
        "delay_rate_pct": round(pay * 100, 1),
        "discount_pct":   round(discount * 100, 1),
        "contract_type":  contract,
        "rating":         rating,
        "rating_color":   rating_color,
        "risk_level":     risk_level,
        "gauge_value":    round(pay * 100, 1),
    }


def _risk_profile(r, df) -> dict:
    churn = float(r["churn_probability"])
    health = float(r["health_score"])
    pay = float(r["payment_delay_rate"])
    adopt = float(r["current_feature_adoption_rate"])
    tickets = float(r.get("current_tickets_count", 2))
    ticket_growth = float(r["current_ticket_growth"])

    # Composite risk score 0–100 (higher = riskier)
    churn_score   = churn * 35
    health_score  = (100 - health) / 100 * 25
    payment_score = pay * 20
    adoption_score = (1 - adopt) * 12
    ticket_score  = min(ticket_growth * 8, 8)
    composite_risk = min(100, round(churn_score + health_score + payment_score + adoption_score + ticket_score, 1))

    # Percentile vs portfolio
    df_risk = (df["churn_probability"] * 35 + (100 - df["health_score"]) / 100 * 25 + df["payment_delay_rate"] * 20)
    percentile = round(float((df_risk < (churn * 35 + (100 - health) / 100 * 25 + pay * 20)).mean()) * 100, 1)

    dimensions = [
        {"label": "Churn Risk",         "score": round(churn * 100, 1),       "weight": "35%", "color": "#ef4444" if churn > 0.4 else "#10b981"},
        {"label": "Health Score",       "score": round(health, 1),             "weight": "25%", "color": "#3b82f6", "invert": True},
        {"label": "Payment Behaviour",  "score": round(pay * 100, 1),          "weight": "20%", "color": "#ef4444" if pay > 0.3 else "#10b981"},
        {"label": "Feature Adoption",   "score": round(adopt * 100, 1),        "weight": "12%", "color": "#7c3aed", "invert": True},
        {"label": "Support Load",       "score": round(min(ticket_growth * 100, 100), 1), "weight": "8%",  "color": "#f59e0b"},
    ]

    if composite_risk < 25:
        risk_label = "Low Risk"; risk_color = "#10b981"
    elif composite_risk < 50:
        risk_label = "Moderate Risk"; risk_color = "#f59e0b"
    elif composite_risk < 75:
        risk_label = "High Risk"; risk_color = "#ef4444"
    else:
        risk_label = "Critical Risk"; risk_color = "#dc2626"

    return {
        "composite_score": composite_risk,
        "risk_label":      risk_label,
        "risk_color":      risk_color,
        "percentile":      percentile,
        "dimensions":      dimensions,
    }


def _timeline_events(r) -> list[dict]:
    events = []
    tenure = float(r["historical_tenure_months"])
    mrr_growth = float(r["mrr_growth_first3_to_last3"])
    pay = float(r["payment_delay_rate"])
    adopt = float(r["current_feature_adoption_rate"])
    churn = float(r["churn_probability"])
    health = float(r["health_score"])
    ticket_growth = float(r["current_ticket_growth"])
    usage_growth = float(r["current_usage_growth"])

    if tenure >= 1:
        events.append({"month": -int(tenure), "event": "Account Activated", "type": "success",
                        "detail": f"Customer onboarded {int(tenure)} months ago"})
    if tenure >= 3:
        events.append({"month": -int(tenure) + 2, "event": "Initial Onboarding Complete", "type": "info",
                        "detail": "Feature introduction and initial training completed"})
    if adopt > 0.5:
        events.append({"month": -4, "event": "Feature Adoption Milestone", "type": "success",
                        "detail": f"Adoption reached {adopt:.0%} — above 50% threshold"})
    if mrr_growth > 0.08:
        events.append({"month": -3, "event": "MRR Growth Detected", "type": "upgrade",
                        "detail": f"Revenue trend turned positive ({mrr_growth:.0%} growth)"})
    if usage_growth > 0.1:
        events.append({"month": -2, "event": "Usage Spike", "type": "info",
                        "detail": f"Usage grew {usage_growth:.0%} — engagement increasing"})
    if pay > 0.2:
        events.append({"month": -2, "event": "Payment Delay Signal", "type": "warning",
                        "detail": f"Delay rate elevated at {pay:.0%}"})
    if ticket_growth > 0.2:
        events.append({"month": -1, "event": "Support Ticket Surge", "type": "warning",
                        "detail": f"Ticket volume grew {ticket_growth:.0%} last period"})
    if health < 55:
        events.append({"month": -1, "event": "Health Score Alert", "type": "danger",
                        "detail": f"Health dropped to {health:.0f}/100 — below 60 threshold"})
    if churn > 0.5:
        events.append({"month": 0, "event": "Churn Risk Flagged", "type": "danger",
                        "detail": f"Model predicts {churn:.0%} churn probability — action required"})
    elif churn < 0.2 and health > 70:
        events.append({"month": 0, "event": "Healthy Customer Signal", "type": "success",
                        "detail": "Low churn risk with strong health score"})

    events.sort(key=lambda e: e["month"])
    return events


@router.get("/{account_id}", response_model=Envelope)
def get_individual_analysis(account_id: int, _user=Depends(get_current_user)):
    """
    Full individual customer deep-dive analysis.
    Returns: SHAP explanation, recommendations, CLV breakdown,
    payment profile, composite risk score, and lifecycle timeline.
    """
    df = _get_df()
    row = df[df["account_id"] == account_id]
    if len(row) == 0:
        raise HTTPException(404, f"Customer {account_id} not found")
    r = row.iloc[0]

    # Portfolio benchmarks
    avg_clv    = round(float(df["predicted_clv"].mean()), 2)
    avg_mrr    = round(float(df["current_mrr"].mean()), 2)
    avg_health = round(float(df["health_score"].mean()), 1)
    avg_churn  = round(float(df["churn_probability"].mean()), 4)
    avg_adopt  = round(float(df["current_feature_adoption_rate"].mean()), 4)

    # SHAP local explanation
    from app.services.shap_service import get_local_explanation
    shap_data = get_local_explanation(account_id)

    # Build waterfall-ready SHAP drivers (top 10 by |shap_value|)
    shap_drivers = []
    if shap_data.get("available") and shap_data.get("top_drivers"):
        base = shap_data.get("base_value", 0) or 0
        running = float(base)
        for d in shap_data["top_drivers"][:10]:
            sv = float(d["shap_value"])
            shap_drivers.append({
                "feature":       d["display_name"],
                "shap_value":    round(sv, 2),
                "feature_value": round(float(d["feature_value"]), 4),
                "direction":     d["direction"],
                "start":         round(running, 2),
                "end":           round(running + sv, 2),
                "color":         "#10b981" if sv >= 0 else "#ef4444",
            })
            running += sv

    pred_clv  = float(r["predicted_clv"])
    curr_mrr  = float(r["current_mrr"])
    health    = float(r["health_score"])
    churn     = float(r["churn_probability"])
    adopt     = float(r["current_feature_adoption_rate"])
    tenure    = float(r["historical_tenure_months"])
    mrr_growth = float(r["mrr_growth_first3_to_last3"])

    return Envelope(data={
        # Identity
        "account_id":    int(r["account_id"]),
        "account_name":  f"Account-{int(r['account_id'])} ({r['company_size']})",
        "industry":      r["industry"],
        "tier":          r["company_size"],
        "contract_type": r["contract_type"],
        "regime_state":  r["regime_state"],
        "clv_segment":   r["clv_segment"],
        "clv_trajectory":r["clv_trajectory"],
        "churn_risk_level": r["churn_risk_level"],
        "tenure_months": round(tenure, 1),

        # Core snapshot
        "snapshot": {
            "current_mrr":       round(curr_mrr, 2),
            "predicted_clv":     round(pred_clv, 2),
            "health_score":      round(health, 1),
            "churn_probability": round(churn, 4),
            "feature_adoption":  round(adopt, 4),
            "active_users":      round(float(r["current_active_users"]), 1),
            "mrr_growth":        round(mrr_growth, 4),
            "usage_growth":      round(float(r["current_usage_growth"]), 4),
            "ticket_count":      round(float(r.get("current_tickets_count", 2)), 1),
            "payment_delay":     round(float(r["payment_delay_rate"]), 4),
            "discount_pct":      round(float(r["discount_pct"]), 4),
        },

        # Portfolio benchmarks
        "benchmarks": {
            "avg_clv":    avg_clv,
            "avg_mrr":    avg_mrr,
            "avg_health": avg_health,
            "avg_churn":  avg_churn,
            "avg_adopt":  avg_adopt,
        },

        # SHAP explanation
        "shap": {
            "available":    shap_data.get("available", False),
            "method":       shap_data.get("method", ""),
            "base_value":   shap_data.get("base_value"),
            "predicted_clv":shap_data.get("predicted_clv"),
            "waterfall":    shap_drivers,
            "note":         shap_data.get("note", ""),
        },

        # AI recommendations
        "recommendations": _build_recommendations(r),

        # CLV breakdown
        "clv_breakdown": _clv_breakdown(r, pred_clv, avg_clv),

        # Payment profile
        "payment_profile": _payment_profile(r),

        # Composite risk
        "risk_profile": _risk_profile(r, df),

        # Lifecycle timeline
        "timeline": _timeline_events(r),

        "data_note": "All metrics derived from the 50K synthetic SaaS dataset and real trained model.",
    })
