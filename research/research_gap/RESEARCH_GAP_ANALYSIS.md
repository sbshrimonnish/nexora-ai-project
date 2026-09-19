# RESEARCH GAP ANALYSIS — NEXORA AI

## 1. Literature Mapping
This document contrasts existing academic literature on Customer Lifetime Value (CLV) with the technical implementation in **Nexora AI**.

---

## 2. Research Matrix

| Paper Category | Existing Methods | Identified Limitations | Nexora AI Solution |
| :--- | :--- | :--- | :--- |
| **Probabilistic Models** (Schmittlein et al., Fader & Hardie) | BG/NBD & Gamma-Gamma models | Assumes static customer purchase behavior. Cannot process multi-dimensional engagement data (support load, payment delays, error rates). | Supervised regression ensembles (Random Forest, Gradient Boosting, XGBoost) trained on 37 behavioral features. |
| **RFM Heuristics** (Hughes et al.) | Manual Recency, Frequency, Monetary scoring | Lacks forward-looking predictive capacity over future multi-month horizons. | RFM metrics integrated into machine learning regression models for 12-month forward revenue prediction ($R^2 = 0.924$). |
| **Black-Box ML Models** (Benoit et al.) | Deep Neural Networks & Gradient Boosters | Opaque predictions that business and Customer Success teams cannot understand or trust ("Black-Box Problem"). | Applied SHAP (SHapley Additive exPlanations) TreeExplainer for local per-customer waterfall attributions. |
| **Churn Classifiers** (Verbeke et al.) | Binary Churn Classification (0 or 1) | Focuses solely on churn risk without quantifying actual monetary account value or growth potential. | Continuous CLV regression (`predicted_clv`), with churn kept as a secondary supporting metric. |
| **Descriptive Dashboards** (Commercial CRMs) | Static reporting of past revenue | Reactive rather than predictive; offers no automated action playbooks. | AI Action Recommendation Engine generating priority-weighted Customer Success playbooks. |

---

## 3. Methodological Improvements in Nexora AI
1. **Explainable AI Integration:** Bridges the gap between high accuracy ($R^2 = 0.924$) and operational transparency via local SHAP attributions.
2. **Multi-Signal Feature Matrix:** Combines financial metrics, product adoption rates, payment delay flags, and support ticket growth rates.
3. **Temporal Validation:** Prevents data leakage by strictly separating historical observation windows from future target evaluation windows.
