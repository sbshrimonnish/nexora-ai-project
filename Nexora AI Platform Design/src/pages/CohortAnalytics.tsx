import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cohortData } from "../data/demoData";

const retentionCurves = [
  { period: "Month 1", q1_23: 100, q2_23: 100, q3_23: 100, q4_23: 100, q1_24: 100 },
  { period: "Month 3", q1_23: 96, q2_23: 94, q3_23: 95, q4_23: 93, q1_24: 94 },
  { period: "Month 6", q1_23: 93, q2_23: 91, q3_23: 92, q4_23: 90, q1_24: 92 },
  { period: "Month 9", q1_23: 91, q2_23: 89, q3_23: 90, q4_23: 88, q1_24: 90 },
  { period: "Month 12", q1_23: 89, q2_23: 87, q3_23: 89, q4_23: 86, q1_24: 88 },
  { period: "Month 18", q1_23: 86, q2_23: 83, q3_23: 85, q4_23: 83, q1_24: null },
  { period: "Month 24", q1_23: 83, q2_23: 80, q3_23: 82, q4_23: null, q1_24: null },
];

const heatmapColors = (val: number) => {
  if (val >= 90) return "#10b981";
  if (val >= 80) return "#6366f1";
  if (val >= 70) return "#f59e0b";
  return "#ef4444";
};

export default function CohortAnalytics() {
  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Cohort Analytics</h1>
        <p className="page-subtitle">Customer cohort analysis by acquisition period — CLV, revenue, and customer retention</p>
      </div>

      {/* Cohort summary table */}
      <div className="chart-card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 600 }}>
          Cohort Summary Table
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                {["Cohort", "Customers", "Initial Avg CLV", "Current Avg CLV", "CLV Retention", "Revenue Retention", "Customer Retention"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map(c => (
                <tr key={c.cohort}>
                  <td><span style={{ fontWeight: 600, color: "#6366f1", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{c.cohort}</span></td>
                  <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.customers}</span></td>
                  <td><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{(c.initialClv / 100000).toFixed(1)}L</span></td>
                  <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>₹{(c.currentClv / 100000).toFixed(1)}L</span></td>
                  <td>
                    <span style={{ fontWeight: 700, color: heatmapColors(c.clvRetention), fontFamily: "'JetBrains Mono', monospace" }}>{c.clvRetention}%</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: heatmapColors(c.revenueRetention), fontFamily: "'JetBrains Mono', monospace" }}>{c.revenueRetention}%</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--muted)", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                        <div style={{ height: "100%", width: `${c.customerRetention}%`, background: heatmapColors(c.customerRetention), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: heatmapColors(c.customerRetention) }}>
                        {c.customerRetention}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Retention curves */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Quarterly CLV Retention Curves</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>% of initial CLV retained over time by acquisition cohort</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={retentionCurves}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
              <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => v + "%"} />
              <Tooltip formatter={(v: any) => v + "%"} />
              <Legend iconType="circle" iconSize={7} />
              <Line type="monotone" dataKey="q1_23" name="Q1 2023" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="q2_23" name="Q2 2023" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="q3_23" name="Q3 2023" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="q4_23" name="Q4 2023" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="q1_24" name="Q1 2024" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CLV Retention heatmap */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>CLV Retention Heatmap</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Cohort × period retention matrix</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textAlign: "left", paddingBottom: 6 }}>Cohort</th>
                  {["M3", "M6", "M9", "M12", "M18"].map(p => (
                    <th key={p} style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textAlign: "center", paddingBottom: 6 }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((c, i) => {
                  const vals = [
                    c.clvRetention - i * 0.5,
                    c.clvRetention - i * 0.7 - 2,
                    c.clvRetention - i * 0.9 - 4,
                    c.clvRetention - i * 1.1 - 6,
                    i < 3 ? c.clvRetention - i * 1.3 - 8 : null,
                  ];
                  return (
                    <tr key={c.cohort}>
                      <td style={{ fontSize: 12, color: "var(--foreground)", paddingRight: 8, fontWeight: 600, whiteSpace: "nowrap" }}>{c.cohort}</td>
                      {vals.map((v, j) => (
                        <td key={j} style={{ padding: 2 }}>
                          {v !== null ? (
                            <div style={{
                              width: 46, height: 32, borderRadius: 6, background: heatmapColors(v) + "25",
                              border: `1px solid ${heatmapColors(v)}50`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11.5, fontWeight: 700, color: heatmapColors(v),
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {v.toFixed(0)}%
                            </div>
                          ) : (
                            <div style={{ width: 46, height: 32, borderRadius: 6, background: "var(--muted)", border: "1px solid var(--border)" }} />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cohort revenue comparison */}
      <div className="chart-card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Cohort Revenue Comparison — Initial vs Current CLV</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cohortData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(1) + "L"} />
            <Tooltip formatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"} />
            <Legend iconType="circle" iconSize={7} />
            <Bar dataKey="initialClv" name="Initial CLV" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Bar dataKey="currentClv" name="Current CLV" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
