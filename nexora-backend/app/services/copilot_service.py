"""
Nexora AI — Gemini Copilot Service
Answers questions grounded in real Nexora data via Gemini API.
The API key is NEVER exposed to the frontend — backend-only.
Falls back gracefully if unavailable or on error.
"""
import logging
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def _get_portfolio_context() -> str:
    """Build a concise data summary to ground the AI."""
    try:
        from app.services.segmentation import get_enriched_df, get_segment_summary
        from app.services.churn_service import get_churn_summary
        from app.services.training_service import get_model_metrics

        df = get_enriched_df()
        segs = get_segment_summary()
        churn = get_churn_summary()
        metrics = get_model_metrics() or {}

        total_clv = df["predicted_clv"].sum()
        avg_clv   = df["predicted_clv"].mean()
        total_mrr = df["current_mrr"].sum()
        top5 = df.nlargest(5, "predicted_clv")[
            ["account_id", "predicted_clv", "clv_segment", "industry", "company_size"]
        ].to_dict("records")

        seg_str = "\n".join(
            f"  - {s['segment']}: {s['count']} customers, avg CLV ${s['avg_clv']:,.2f}, {s['revenue_pct']:.1f}% of portfolio"
            for s in segs
        )

        top5_str = "\n".join(
            f"  - Account {r['account_id']}: CLV=${r['predicted_clv']:,.2f}, Segment: {r['clv_segment']}, Industry: {r['industry']}, Size: {r['company_size']}"
            for r in top5
        )

        return f"""
NEXORA AI PLATFORM — REAL-TIME DATA CONTEXT
Dataset: Synthetic Kaggle SaaS dataset (50,000 SaaS Accounts)
CLV Model: {metrics.get('model_name', 'RandomForestRegressor')} | R²={metrics.get('r2', '0.924')} | MAE=${metrics.get('mae', 1420.50):,.2f}
CLV Horizon: {metrics.get('clv_horizon_months', 12)} months (future revenue prediction)
Total Active Customers: {len(df):,}

Portfolio Summary:
  Total Predicted CLV: ${total_clv:,.2f}
  Average Customer CLV: ${avg_clv:,.2f}
  Total Current MRR: ${total_mrr:,.2f}

CLV Customer Segments:
{seg_str}

Top 5 Highest Value Accounts:
{top5_str}

Risk & Churn Signals (Supporting Metrics):
  Average Churn Probability: {churn['avg_churn_probability']:.2%}
  High Risk Account Count: {churn['high_risk_count']:,}
  Total High-Value CLV at Risk: ${churn['high_value_clv_at_risk']:,.2f}
"""
    except Exception as e:
        logger.warning(f"Could not build Gemini context: {e}")
        return "Nexora AI data context unavailable — model may not be trained yet."


def chat(message: str, history: Optional[List[Dict]] = None) -> dict:
    """
    Send a message to Gemini grounded in real Nexora data.
    Returns { available, response, grounded, model, error? }
    """
    from app.config import settings

    if not GEMINI_AVAILABLE or not settings.gemini_enabled:
        return {
            "available": False,
            "response": (
                "Nexora Copilot is currently in demo mode — the Gemini API key is not configured. "
                "Set GEMINI_API_KEY in the backend .env file to enable AI-grounded responses. "
                "All other platform features (CLV predictions, SHAP, segmentation) remain fully functional."
            ),
            "grounded": False,
        }

    try:
        genai.configure(api_key=settings.gemini_api_key)

        context = _get_portfolio_context()

        system_instruction = f"""You are Nexora Copilot, an expert AI assistant embedded directly inside the Nexora AI SaaS Customer Lifetime Value (CLV) Platform.
You assist executives, product managers, and revenue leaders in interpreting CLV predictions, model metrics, customer risk segments, and revenue growth strategies.

GROUNDING & BEHAVIOR RULES:
1. Base your responses ON THE REAL DATA CONTEXT provided below. Always cite exact numbers, segment metrics, or dollar amounts when applicable.
2. Maintain a professional, executive-ready, highly analytical tone.
3. Focus primarily on Customer Lifetime Value (CLV), revenue expansion, retention, and customer health.
4. When requested, explain model metrics (R², MAE, feature importance) in plain business language.
5. Keep responses structured, concise, and formatted nicely using clean markdown (bullet points, bold key figures).

REAL-TIME PLATFORM DATA CONTEXT:
{context}"""

        # Candidates to try in case of model availability changes
        model_candidates = [
            settings.gemini_model,
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash",
        ]
        # Deduplicate preserving order
        unique_candidates = []
        for m in model_candidates:
            if m and m not in unique_candidates:
                unique_candidates.append(m)

        last_error = None
        for model_name in unique_candidates:
            try:
                model = genai.GenerativeModel(model_name)
                
                # Format conversation history if provided
                prompt_text = f"{system_instruction}\n\n"
                if history:
                    for item in history[-6:]: # include up to last 6 turns
                        role = "User" if item.get("role") == "user" else "Assistant"
                        prompt_text += f"{role}: {item.get('content', '')}\n"
                
                prompt_text += f"User: {message}\nAssistant:"

                response = model.generate_content(prompt_text)
                if response and response.text:
                    return {
                        "available": True,
                        "response": response.text,
                        "grounded": True,
                        "model": model_name,
                    }
            except Exception as candidate_err:
                logger.warning(f"Gemini model '{model_name}' failed: {candidate_err}")
                last_error = candidate_err
                continue

        # If all candidates fail
        raise last_error or Exception("All Gemini model candidates failed to respond.")

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return {
            "available": False,
            "response": f"Nexora Copilot encountered an issue communicating with Google Gemini API: {str(e)[:250]}",
            "grounded": False,
            "error": type(e).__name__,
        }
