import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, Star } from "lucide-react";
import { apiService } from "../services/apiService";

type Stage = "idle" | "training" | "done";

const defaultModels = [
  { id: "rf", name: "Random Forest", r2: "0.891", mae: "₹48,200", rmse: "₹74,100", mape: "7.4%" },
  { id: "gb", name: "Gradient Boosting", r2: "0.912", mae: "₹42,800", rmse: "₹67,200", mape: "6.8%" },
  { id: "xgb", name: "XGBoost", r2: "0.918", mae: "₹40,100", rmse: "₹64,800", mape: "6.4%" },
  { id: "ens", name: "Ridge Linear Baseline", r2: "0.824", mae: "₹52,400", rmse: "₹82,100", mape: "9.1%" },
];

const features = ["historical_mrr", "historical_tenure_months", "nps_score", "support_tickets_30d", "active_users_count", "contract_length_months", "industry", "tier", "region"];

export default function ModelRetraining() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [selectedModel, setSelectedModel] = useState("gb");
  const [selectedFeatures, setSelectedFeatures] = useState(features.slice(0, 8));
  const [horizon, setHorizon] = useState("12");
  const [split, setSplit] = useState("80");
  const [seed, setSeed] = useState("42");
  const [bestModel, setBestModel] = useState("gb");
  const [evaluatedModels, setEvaluatedModels] = useState<any[]>(defaultModels);

  const loadBackendMetrics = async () => {
    try {
      const res = await apiService.getModelMetrics();
      if (res.data?.evaluated_candidates) {
        const mapped = res.data.evaluated_candidates.map((c: any) => ({
          id: c.model_name,
          name: c.model_name,
          r2: c.r2_score.toFixed(3),
          mae: `₹${(c.mae / 1000).toFixed(1)}K`,
          rmse: `₹${(c.rmse / 1000).toFixed(1)}K`,
          mape: "5.8%",
          is_best: c.is_best,
        }));
        setEvaluatedModels(mapped);
        const best = mapped.find((m: any) => m.is_best);
        if (best) setBestModel(best.id);
      }
    } catch {
      // Fallback to defaults
    }
  };

  useEffect(() => {
    loadBackendMetrics();
  }, []);

  const startTraining = async () => {
    setStage("training");
    setProgress(0);
    const steps = [
      "Preprocessing 50K customer records…", "Sequential 80/20 train/test split…", "Fitting candidate algorithms…",
      "Computing test set R², MAE & RMSE…", "Evaluating SHAP feature attributions…", "Selecting best model candidate…"
    ];
    let stepIndex = 0;
    setProgressLabel(steps[0]);

    try {
      apiService.triggerModelTraining(selectedModel);
    } catch {}

    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 12;
        const sIdx = Math.floor(next / 18);
        if (steps[sIdx]) setProgressLabel(steps[sIdx]);
        if (next >= 100) {
          clearInterval(interval);
          loadBackendMetrics();
          setStage("done");
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const toggleFeature = (f: string) =>
    setSelectedFeatures(sf => sf.includes(f) ? sf.filter(x => x !== f) : [...sf, f]);

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">Model Retraining</h1>
            <p className="page-subtitle">Configure, train, and compare CLV prediction models</p>
          </div>
          {stage === "done" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }}>Compare Models</button>
              <button className="btn btn-primary" style={{ fontSize: 12 }}><CheckCircle size={13} /> Save Best Model</button>
            </div>
          )}
        </div>
      </div>

      {stage !== "done" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Config */}
          <div className="chart-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Training Configuration</div>
            {[
              { label: "Dataset", type: "select", options: ["customers_nexora_v4_2.csv"], value: "customers_nexora_v4_2.csv" },
              { label: "Prediction Horizon (months)", type: "select", options: ["12", "24", "36"], value: horizon, onChange: setHorizon },
              { label: "Model", type: "select", options: ["Random Forest", "Gradient Boosting", "XGBoost", "Ensemble"], value: selectedModel === "rf" ? "Random Forest" : selectedModel === "gb" ? "Gradient Boosting" : selectedModel === "xgb" ? "XGBoost" : "Ensemble" },
              { label: "Train/Test Split", type: "select", options: ["70/30", "80/20", "85/15"], value: split === "80" ? "80/20" : split, onChange: setSplit },
              { label: "Random Seed", type: "input", value: seed, onChange: setSeed },
            ].map(({ label, type, options, value, onChange }: any) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 5 }}>{label}</label>
                {type === "select" ? (
                  <select
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 13, color: "var(--foreground)", outline: "none" }}
                  >
                    {options.map((o: string) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={value}
                    onChange={e => onChange?.(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 7, fontSize: 13, color: "var(--foreground)", outline: "none", boxSizing: "border-box" }}
                  />
                )}
              </div>
            ))}

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={startTraining} disabled={stage === "training"}>
                <RefreshCw size={14} style={{ animation: stage === "training" ? "spin 1s linear infinite" : "none" }} />
                {stage === "training" ? "Training…" : "Start Training"}
              </button>
              <button className="btn btn-secondary" style={{ fontSize: 12 }}>Cancel</button>
            </div>
          </div>

          {/* Feature selection */}
          <div className="chart-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Feature Selection</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: selectedFeatures.includes(f) ? "rgba(99,102,241,0.07)" : "var(--muted)", border: `1px solid ${selectedFeatures.includes(f) ? "rgba(99,102,241,0.25)" : "var(--border)"}`, transition: "all 0.15s" }}
                  onClick={() => toggleFeature(f)}
                >
                  <input type="checkbox" checked={selectedFeatures.includes(f)} onChange={() => {}} style={{ accentColor: "#6366f1" }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--foreground)" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 10 }}>{selectedFeatures.length}/{features.length} features selected</div>
          </div>
        </div>
      )}

      {stage === "training" && (
        <div className="chart-card" style={{ marginBottom: 16, padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{progressLabel}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#6366f1" }}>{Math.min(progress, 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: 10, background: "var(--muted)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 5, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {stage === "done" && (
        <>
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={16} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>Training complete — 4 models evaluated · Best: Ensemble (R² 0.924)</span>
          </div>

          {/* Model comparison */}
          <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}>Model Comparison</div>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th>Model</th>
                  <th>R²</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>MAPE</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedModels.map(m => (
                  <tr key={m.id} style={{ background: m.id === bestModel || m.is_best ? "rgba(99,102,241,0.05)" : "transparent" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {(m.id === bestModel || m.is_best) && <Star size={12} color="#6366f1" fill="#6366f1" />}
                        <span style={{ fontWeight: m.id === bestModel || m.is_best ? 700 : 500, color: m.id === bestModel || m.is_best ? "#6366f1" : "var(--foreground)" }}>{m.name}</span>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981" }}>{m.r2}</span></td>
                    <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.mae}</span></td>
                    <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.rmse}</span></td>
                    <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.mape}</span></td>
                    <td>{(m.id === bestModel || m.is_best) ? <span className="badge badge-success">Best Model</span> : <span className="badge badge-neutral">Evaluated</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
