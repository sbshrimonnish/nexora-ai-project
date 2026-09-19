import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Cell, ReferenceLine
} from "recharts";
import { shapData } from "../data/demoData";

const globalShap = [
  { feature: "Monthly Spend", importance: 0.38 },
  { feature: "Usage Frequency", importance: 0.31 },
  { feature: "Product Adoption", importance: 0.28 },
  { feature: "Tenure", importance: 0.22 },
  { feature: "Revenue Trend", importance: 0.18 },
  { feature: "Company Size", importance: 0.15 },
  { feature: "Contract Length", importance: 0.13 },
  { feature: "Support Tickets", importance: 0.11 },
  { feature: "Sentiment Score", importance: 0.09 },
];

const actualVsPredicted = Array.from({ length: 30 }, (_, i) => ({
  actual: 500000 + i * 320000 + (Math.random() - 0.5) * 200000,
  predicted: 480000 + i * 318000 + (Math.random() - 0.5) * 180000,
}));

const residuals = Array.from({ length: 40 }, (_, i) => ({
  x: i,
  residual: (Math.random() - 0.5) * 300000,
}));

export default function XAIModel() {
  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">XAI / Model Evaluation Console</h1>
            <p className="page-subtitle">CLV regression metrics and explainability — v2.3.1 · Trained Mar 15, 2025</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ fontSize: 11, padding: "4px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#10b981", fontWeight: 600 }}>
              Model Active
            </div>
            <button className="btn btn-secondary" style={{ fontSize: 12 }}>Compare Models</button>
          </div>
        </div>
      </div>

      {/* Model info bar */}
      <div style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px", marginBottom: 20, display: "flex", gap: 32 }}>
        {[
          { label: "Model Version", value: "v2.3.1" },
          { label: "Algorithm", value: "Gradient Boosting + Ensemble" },
          { label: "Training Date", value: "Mar 15, 2025" },
          { label: "Dataset Version", value: "v4.2.1" },
          { label: "Training Records", value: "42,500" },
          { label: "Test Records", value: "7,500" },
          { label: "Last Retrained", value: "2 days ago" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--foreground)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* CLV Metrics (primary) */}
        <div className="chart-card" style={{ border: "1.5px solid rgba(99,102,241,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6366f1", marginBottom: 14 }}>
            CLV Regression Metrics (Primary)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { metric: "MAE", value: "₹42,800", desc: "Mean Absolute Error", good: true },
              { metric: "RMSE", value: "₹67,200", desc: "Root Mean Squared Error", good: true },
              { metric: "R²", value: "0.912", desc: "Coefficient of Determination", good: true },
              { metric: "MAPE", value: "6.8%", desc: "Mean Absolute Pct Error", good: true },
            ].map(({ metric, value, desc, good }) => (
              <div key={metric} style={{ padding: "14px", background: "rgba(99,102,241,0.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#6366f1", marginBottom: 4, fontWeight: 700 }}>{metric}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Metrics (secondary) */}
        <div className="chart-card" style={{ opacity: 0.85 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 14 }}>
            Churn Classification Metrics (Supporting)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              { metric: "Accuracy", value: "89.2%" },
              { metric: "Precision", value: "86.4%" },
              { metric: "Recall", value: "84.1%" },
              { metric: "F1", value: "85.2%" },
              { metric: "ROC-AUC", value: "0.934" },
            ].map(({ metric, value }) => (
              <div key={metric} style={{ padding: "12px 10px", background: "var(--muted)", borderRadius: 9, border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)", marginBottom: 4 }}>{metric}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Actual vs Predicted */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Actual vs Predicted CLV</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Scatter plot — test set predictions</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
              <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    <div>Actual: ₹{(d.actual / 100000).toFixed(1)}L</div>
                    <div>Predicted: ₹{(d.predicted / 100000).toFixed(1)}L</div>
                  </div>
                );
              }} />
              <Scatter data={actualVsPredicted} fill="#6366f1" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Residuals */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Residual Distribution</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Prediction error — should be centered near 0</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" name="Sample" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
              <YAxis dataKey="residual" name="Residual" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 1000).toFixed(0) + "K"} />
              <Tooltip formatter={(v: number) => "₹" + (v / 1000).toFixed(0) + "K"} />
              <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="4 2" />
              <Scatter data={residuals} fill="#8b5cf6" fillOpacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global SHAP */}
      <div className="chart-card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Global SHAP Feature Importance</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Mean absolute SHAP values — top 9 features influencing CLV prediction</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={globalShap} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => (v * 100).toFixed(0) + "%"} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} width={120} />
              <Tooltip formatter={(v: number) => (v * 100).toFixed(0) + "% importance"} />
              <Bar dataKey="importance" name="SHAP Importance" radius={[0, 4, 4, 0]}>
                {globalShap.map((_, i) => (
                  <Cell key={i} fill={`hsl(${246 - i * 10}, ${70 - i * 3}%, ${52 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--foreground)" }}>SHAP Interpretation</div>
            {globalShap.map((f, i) => (
              <div key={f.feature} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `hsl(${246 - i * 10}, ${70 - i * 3}%, ${52 + i * 3}%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--foreground)" }}>{f.feature}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>SHAP value: {(f.importance * 100).toFixed(0)}%</div>
                </div>
                <div style={{ width: 60, height: 5, background: "var(--muted)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${f.importance * 100}%`, height: "100%", background: `hsl(${246 - i * 10}, ${70 - i * 3}%, ${52 + i * 3}%)`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
