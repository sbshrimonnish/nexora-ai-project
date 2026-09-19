# NEXORA AI — PROJECT REPORT

## Executive Summary
**Nexora AI** is an enterprise-grade, explainable Customer Lifetime Value (CLV) prediction and intelligence platform tailored for B2B and SaaS organizations. Grounded in advanced machine learning and Explainable AI (XAI), the platform transforms raw transactional and engagement data into 12-month forward revenue predictions, 5-dimension risk profiles, local SHAP feature attributions, and automated Customer Success retention playbooks.

---

## Chapter 1: Introduction
### 1.1 Background
Customer Lifetime Value (CLV) represents the total net revenue a business expects to earn from a customer throughout their commercial relationship. In subscription software (SaaS) and B2B models, accurate CLV estimation is critical for guiding Customer Acquisition Cost (CAC) thresholds, resource allocation, churn mitigation, and tier-based customer success strategies.

### 1.2 Problem Statement
Traditional Customer Relationship Management (CRM) tools operate reactively, relying on static historical spend without predicting future lifetime value. Existing machine learning implementations often suffer from two major flaws:
1. **The "Black-Box" Problem:** Complex model predictions are opaque to business managers.
2. **Conflation with Churn:** Over-focusing on binary churn prediction rather than quantifying continuous monetary customer value.

### 1.3 Project Motivation & Domain
Nexora AI addresses this challenge by combining supervised regression ensembles with SHAP TreeExplainer, establishing a clear link between predictive machine learning and actionable Customer Success workflows.

---

## Chapter 2: Literature Review & Research Gap
### 2.1 Summary of Existing Literature
- **Probabilistic Models (BG/NBD & Gamma-Gamma):** Effective for basic transactional recency and frequency modeling (Schmittlein et al., Fader & Hardie), but incapable of modeling complex non-linear interactions, support load, or payment delay rates.
- **RFM Heuristics:** Useful for basic segmentation, but lack predictive horizon capability.
- **Machine Learning Regressors:** Random Forest and XGBoost achieve high regression accuracy ($R^2 > 0.90$), but lack built-in business decision-support mechanisms.

### 2.2 Research Gap Identified
1. **Lack of Explainability:** Existing ML CLV literature rarely incorporates local SHAP feature attribution to explain *why* an individual customer is assigned a specific target prediction.
2. **Single-Metric Focus:** Failure to integrate multi-dimensional signals (Payment Delays, Feature Adoption, Support Ticket Spikes) into unified risk indices.

---

## Chapter 3: Dataset & Preprocessing Pipeline
### 3.1 Dataset Specification
- **File:** `nexora_clv_50k_model_ready.csv`
- **Volume:** 50,000 unique B2B SaaS accounts
- **Dimensions:** 37 feature columns
- **Target Variable:** `clv_target_12m_revenue_based` (12-Month Forward Predicted CLV in ₹)

### 3.2 Preprocessing Steps
1. **Missing Value Imputation:** Median imputation for continuous metrics, mode for categorical fields.
2. **Outlier Detection:** Interquartile Range (IQR) detection with 1st/99th percentile clipping.
3. **Categorical Encoding:** One-hot and target encoding for `company_size`, `industry`, `contract_type`, and `regime_state`.
4. **Feature Scaling:** StandardScaler applied prior to linear baseline regression.

---

## Chapter 4: Feature Engineering & Segmentation
### 4.1 Engineered Metrics
- `mrr_growth_first3_to_last3`: Sequential revenue growth velocity.
- `payment_delay_rate`: Ratio of late invoice payments.
- `current_feature_adoption_rate`: Platform capability utilization ratio.
- `current_ticket_growth`: Support ticket surge rate.

### 4.2 Customer Segmentation
Accounts are grouped into 6 distinct behavioral tiers:
1. **High Value**
2. **Growth Opportunity**
3. **Stable Value**
4. **Developing**
5. **Declining Value**
6. **Low Value**

---

## Chapter 5: Machine Learning & Evaluation
### 5.1 Evaluated Algorithms
- Linear Regression & Ridge Baseline
- Decision Tree & Random Forest Regressor
- Gradient Boosting & XGBoost Regressor
- LightGBM & Weighted Ensemble

### 5.2 Performance Comparison

| Model | MAE (₹) | RMSE (₹) | R² Score |
| :--- | :---: | :---: | :---: |
| Linear Regression | 84,200 | 128,500 | 0.710 |
| Decision Tree | 52,100 | 89,400 | 0.814 |
| Random Forest | 41,300 | 68,200 | 0.902 |
| Gradient Boosting | 39,800 | 64,500 | 0.916 |
| **Ensemble (RF + XGB + GB)** | **38,400** | **62,100** | **0.924** |

---

## Chapter 6: Explainable AI & Business Insights
### 6.1 SHAP TreeExplainer Integration
Global SHAP analysis reveals that `current_mrr` (38%), `current_feature_adoption_rate` (28%), and `mrr_growth_first3_to_last3` (22%) represent the primary global drivers of 12-month CLV.

### 6.2 Local Customer Explanations
For individual customer accounts, local SHAP waterfall values quantify exact positive (+₹) and negative (-₹) adjustments from the portfolio baseline mean to the final predicted CLV.

---

## Chapter 7: System Architecture & Implementation
- **Backend:** FastAPI, Python 3.14, Scikit-Learn, SHAP, Pandas, Uvicorn.
- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Lucide Icons.
- **API Endpoints:** Live server running on `http://127.0.0.1:8000` with documentation at `/docs`.

---

## Chapter 8: Conclusion & Future Scope
Nexora AI proves that combining machine learning regression with local SHAP attributions bridges the gap between predictive analytics and Customer Success execution. Future extensions include multi-horizon joint forecasting (24m/36m) and automated NLP sentiment extraction from CRM logs.
