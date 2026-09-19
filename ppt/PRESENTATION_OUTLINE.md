# NEXORA AI — MASTER PRESENTATION SLIDE OUTLINE

## Slide 1: Title Slide
- **Project Title:** Nexora AI — Explainable Customer Lifetime Value Prediction & Intelligence Platform
- **Domain:** AI / Machine Learning / Data Science / Customer Analytics
- **Presenter:** [Student Name]
- **Institution:** [College Name]

## Slide 2: Executive Problem Statement
- Traditional CRMs track past spend reactively without forecasting future customer worth.
- Companies waste Customer Success budgets on low-value accounts while high-value accounts churn silently.
- Existing ML models are opaque "black boxes" that business managers cannot understand or act upon.

## Slide 3: Motivation & Vision
- Shift from reactive account management to **proactive predictive CLV intelligence**.
- Combine multi-dimensional SaaS behavioral signals (MRR, adoption, payment delays, support load) with machine learning.
- Provide explainable AI (SHAP) explanations alongside actionable retention playbooks.

## Slide 4: Literature Review & Limitations
- **BG/NBD & Gamma-Gamma Models:** Static probabilistic assumptions, unable to process multi-variable behavioral data.
- **Pure RFM:** Ignores product engagement, support surges, and contract terms.
- **Deep Learning Models:** High accuracy but completely opaque (lack of explainability).

## Slide 5: Identified Research Gap & Nexora AI Contribution
- **Research Gap:** Lack of local explainability and actionability in predictive CLV systems.
- **Nexora AI Solution:** Supervised regression ensemble ($R^2 = 0.924$) + local SHAP waterfall attributions + automated Customer Success playbooks.

## Slide 6: System Pipeline & Architecture
- **Data Flow:** Raw CSV Data (50K) $\rightarrow$ Preprocessing $\rightarrow$ Feature Engineering $\rightarrow$ Model Ensemble $\rightarrow$ SHAP XAI $\rightarrow$ FastAPI REST Backend $\rightarrow$ React UI.

## Slide 7: Dataset Overview
- **Dataset:** 50,000 unique B2B SaaS customer accounts (`nexora_clv_50k_model_ready.csv`).
- **Features (37):** Demographics, MRR, tenure, active users, usage growth, feature adoption, error rates, support tickets, payment delay rates.
- **Target:** `clv_target_12m_revenue_based` (12-Month Forward Predicted Revenue in ₹).

## Slide 8: Data Preprocessing & Validation
- IQR outlier detection & 1st/99th percentile capping.
- Median imputation for missing numeric values.
- StandardScaler scaling & target encoding for categorical fields.

## Slide 9: Feature Engineering & RFM Analysis
- Recency, Frequency, and Monetary metrics engineered alongside 3-month growth trajectories.
- `mrr_growth_first3_to_last3`, `payment_delay_rate`, `current_feature_adoption_rate`.

## Slide 10: Customer Segmentation
- 6 distinct behavioral customer tiers:
  1. High Value
  2. Growth Opportunity
  3. Stable Value
  4. Developing
  5. Declining Value
  6. Low Value

## Slide 11: Machine Learning Model Selection
- Compared Linear Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost, and LightGBM.
- Model Tuning via 5-Fold Cross Validation.

## Slide 12: Model Evaluation & Results
- **Ensemble Model Performance:**
  - $R^2$ Score: **0.924** (30% improvement over linear baseline)
  - MAE: **₹38,400**
  - RMSE: **₹62,100**

## Slide 13: Explainable AI (SHAP Local & Global)
- **Global SHAP:** Identifies `current_mrr` (38%) and `feature_adoption` (28%) as top portfolio drivers.
- **Local SHAP:** Explains individual customer predictions with positive and negative waterfall contribution bars.

## Slide 14: Customer 360° Profile
- Single-page executive summary combining account health index (0–100), financial metrics, SHAP drivers, revenue trends, and AI outreach action drawers.

## Slide 15: Individual Progress Analysis Workbench
- Multi-tab diagnostic interface: Trajectory Trends, SHAP Waterfall, AI Action Plan, 5-Dimension Risk Profile, CLV Breakdown, and Lifecycle Timeline.

## Slide 16: Dynamic Dataset Upload Engine
- Drag-and-drop CSV upload with real-time column validation, schema profiling, and automated model retraining.

## Slide 17: AI Copilot & Conversational Analytics
- Built-in AI Copilot providing plain-language answers to natural language analytics queries.

## Slide 18: Full-Stack Technology Architecture
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend:** FastAPI, Python, Scikit-Learn, SHAP, Pandas.

## Slide 19: Demonstration & User Flow
- Demonstration of real-time account lookup, SHAP waterfall explanation, and retention playbook execution.

## Slide 20: Business Impact & ROI Analysis
- Identified ₹4.7 Cr in at-risk CLV across portfolio; projected ₹2.3 Cr recovery via targeted CS interventions.

## Slide 21: Conclusion
- Successfully demonstrated that machine learning combined with SHAP XAI delivers reliable, explainable, and actionable CLV predictions.

## Slide 22: Future Scope & Roadmap
- Incorporation of NLP sentiment analysis from CRM notes.
- Multi-horizon joint prediction (24-month and 36-month horizons).

## Slide 23: Q&A / Discussion
- Open floor for questions and presentation review.
