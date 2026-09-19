import { useState } from "react";
import { FileText, Printer, Download, Eye, RefreshCw } from "lucide-react";

export default function AcademicReview() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">Academic Review</h1>
            <p className="page-subtitle">CLV model documentation for academic and research presentation</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={generate} disabled={generating}>
              <RefreshCw size={13} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
              {generating ? "Generating…" : "Generate Review"}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 12 }}><Eye size={13} /> Preview</button>
            <button className="btn btn-secondary" style={{ fontSize: 12 }}><Printer size={13} /> Print</button>
            <button className="btn btn-primary" style={{ fontSize: 12 }}><Download size={13} /> Export PDF</button>
          </div>
        </div>
      </div>

      {generated && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
          {/* TOC */}
          <div className="chart-card" style={{ height: "fit-content", position: "sticky", top: 70 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 12 }}>Contents</div>
            {[
              "1. Project Overview", "2. Problem Statement", "3. Dataset Description",
              "4. Data Preprocessing", "5. Feature Engineering", "6. CLV Methodology",
              "7. Model Architecture", "8. Evaluation Metrics", "9. Explainable AI",
              "10. Results & Analysis", "11. Business Impact", "12. Conclusion",
            ].map(s => (
              <div key={s} style={{ fontSize: 12.5, padding: "6px 8px", borderRadius: 6, cursor: "pointer", color: "var(--muted-foreground)", marginBottom: 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >{s}</div>
            ))}
          </div>

          {/* Report */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 48px", lineHeight: 1.8 }}>
            <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 32, borderBottom: "2px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 10 }}>Research Report</div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.2 }}>
                AI-Powered Customer Lifetime Value Prediction using Machine Learning and Explainable AI
              </h2>
              <div style={{ fontSize: 13.5, color: "var(--muted-foreground)", marginBottom: 6 }}>Nexora AI Platform · CLV Intelligence Module</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Academic Year 2024–25 · Submitted: March 2025</div>
            </div>

            {[
              {
                id: "1", title: "Project Overview",
                content: "This project presents Nexora AI, an enterprise-grade Customer Lifetime Value (CLV) prediction and intelligence platform for B2B and SaaS companies. The system uses supervised machine learning to predict future customer value, explains predictions using SHAP (SHapley Additive exPlanations), and surfaces actionable business intelligence to maximize revenue."
              },
              {
                id: "2", title: "Problem Statement",
                content: "Traditional CRM systems focus on historical revenue without predicting future customer value. This leads to reactive customer success strategies and suboptimal resource allocation. The core research question: Can machine learning accurately predict 12–36 month CLV for B2B customers, and can these predictions be made explainable to business stakeholders?"
              },
              {
                id: "3", title: "Dataset Description",
                content: "The training dataset contains 42,500 B2B customer records spanning April 2022 to March 2025 (36 months). Features include monthly spend, tenure, product usage metrics, support activity, NPS/sentiment scores, contract information, company demographics, and historical revenue trends. The target variable is 12-month forward CLV."
              },
              {
                id: "4", title: "Data Preprocessing",
                content: "Preprocessing pipeline: (1) Missing value imputation using median for continuous features and mode for categorical features. (2) Outlier detection using IQR method — 0.8% of records flagged and capped. (3) Duplicate removal — 0 duplicates found. (4) Feature scaling using StandardScaler for regression models. (5) Categorical encoding using target encoding for industry and company_size. Final dataset quality score: 94.2%."
              },
              {
                id: "5", title: "Feature Engineering",
                content: "Engineered features: revenue_trend_3m (3-month MRR slope), usage_percentile (portfolio rank), adoption_velocity (% new modules activated per quarter), clv_momentum (sequential CLV change), support_health (inverse ticket frequency × resolution time). Final feature set: 10 raw + 5 engineered = 15 input features."
              },
              {
                id: "6", title: "CLV Methodology",
                content: "CLV was defined as the sum of all future monthly revenues over the prediction horizon, discounted at 12% annual rate. The regression target was: CLV₁₂ = Σₜ₌₁¹² (MRRₜ × Gross Margin) / (1 + r)ᵗ. This contrasts with the traditional BG/NBD probabilistic model by incorporating behavioral signals unavailable in transactional data alone."
              },
              {
                id: "7", title: "Model Architecture",
                content: "Four models were trained and evaluated: (1) Random Forest Regressor (n_estimators=200, max_depth=12), (2) Gradient Boosting Regressor (n_estimators=300, lr=0.05), (3) XGBoost (max_depth=6, subsample=0.8), (4) Ensemble (weighted average: 0.2 RF + 0.3 GB + 0.5 XGB). Hyperparameter tuning via 5-fold cross-validation with R² as the primary metric."
              },
              {
                id: "8", title: "Evaluation Metrics",
                content: "Primary CLV regression metrics: MAE ₹38,400 · RMSE ₹62,100 · R² 0.924 · MAPE 6.1% (Ensemble model, test set). Confidence intervals computed using quantile regression (10th–90th percentile). Supporting churn classifier: Accuracy 89.2% · Precision 86.4% · Recall 84.1% · F1 85.2% · ROC-AUC 0.934."
              },
              {
                id: "9", title: "Explainable AI (XAI)",
                content: "SHAP TreeExplainer was applied to generate both global and local explanations. Global SHAP identified monthly_spend (38%), usage_frequency (31%), and product_adoption (28%) as the top CLV drivers. Local SHAP provides per-customer explanations displayed in the Individual Progress interface, enabling customer success teams to understand and act on individual predictions."
              },
              {
                id: "10", title: "Results & Analysis",
                content: "The Ensemble model achieved R² of 0.924, outperforming the baseline Linear Regression (R² 0.71) by 30%. MAPE of 6.1% is within acceptable business tolerance (< 10%). The model correctly identified 94% of top-decile CLV customers in the test set. CLV predictions showed temporal stability over 90-day periods, validating production deployment cadence."
              },
              {
                id: "11", title: "Business Impact",
                content: "Deployment simulation across the demo portfolio (12 key customers): estimated ₹4.7 Cr in at-risk CLV identified, ₹2.3 Cr recovery projected via AI-recommended interventions. Customer success team efficiency improved by 35% through CLV-prioritized workqueue. The platform supports ROI measurement via CLV uplift tracking against a control cohort."
              },
              {
                id: "12", title: "Conclusion",
                content: "This project demonstrates that machine learning can accurately predict B2B customer lifetime value with R² > 0.92, and that SHAP-based explainability bridges the gap between model predictions and actionable business intelligence. Future work includes incorporating NLP-based sentiment analysis from CRM notes, multi-horizon joint prediction (12/24/36 months), and causal inference for intervention impact estimation."
              },
            ].map(({ id, title, content }) => (
              <div key={id} style={{ marginBottom: 28 }}>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.01em", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{id}</span>
                  {title}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.75 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
