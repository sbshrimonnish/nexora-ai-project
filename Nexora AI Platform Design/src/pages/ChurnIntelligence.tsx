import { AlertTriangle, TrendingDown, DollarSign, Users } from "lucide-react";
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { segmentData, customers } from "../data/demoData";

const churnDist = [
  { range: "0–10%", count: 1241 },
  { range: "10–20%", count: 892 },
  { range: "20–30%", count: 601 },
  { range: "30–40%", count: 389 },
  { range: "40–50%", count: 248 },
  { range: "50–60%", count: 156 },
  { range: "60–70%", count: 98 },
  { range: "70%+", count: 75 },
];

const quadrantData = customers.filter(c => c.clv > 2000000).map(c => ({
  x: c.churnRisk,
  y: c.clv / 100000,
  name: c.company,
  segment: c.segment,
}));

export default function ChurnIntelligence() {
  return (
    <div className="page-wrap">
      {/* Secondary label banner */}
      <div style={{
        background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
      }}>
        <AlertTriangle size={15} color="#f59e0b" />
        <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>
          <strong>Churn Intelligence — Supporting CLV Analysis.</strong> This screen supports the primary CLV platform. Prioritize customers where high predicted CLV overlaps with high churn risk.
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ color: "var(--foreground)" }}>Churn Intelligence</h1>
        <p className="page-subtitle">Supporting metric for CLV-based customer prioritization</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Overall Churn Probability", value: "8.2%", sub: "portfolio average", icon: AlertTriangle, color: "#f59e0b" },
          { label: "High-Risk Customers", value: "324", sub: "churn risk > 50%", icon: Users, color: "#ef4444" },
          { label: "High-CLV at Churn Risk", value: "47", sub: "CLV > ₹5L + risk > 40%", icon: TrendingDown, color: "#ef4444" },
          { label: "CLV at Risk", value: "₹4.7 Cr", sub: "potential value loss", icon: DollarSign, color: "#ef4444" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="kpi-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={15} color={color} />
              </div>
              <span className={`badge ${color === "#f59e0b" ? "badge-warning" : "badge-danger"}`}>Risk</span>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 700, color, letterSpacing: "-0.02em", marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--foreground)" }}>{label}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Business Insight callout */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))",
        border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6366f1", marginBottom: 6 }}>Strategic Priority</div>
        <div style={{ fontSize: 14.5, color: "var(--foreground)", lineHeight: 1.6, fontStyle: "italic" }}>
          "Prioritize customers where high predicted CLV overlaps with high churn risk. These 47 customers represent ₹4.7 Cr in value at risk — intervening before churn event is estimated to recover 68% of that value."
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 16 }}>
        {/* Churn prob distribution */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Churn Probability Distribution</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Customer count by churn risk band</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={churnDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {churnDist.map((d, i) => (
                  <Cell key={i} fill={i < 3 ? "#10b981" : i < 5 ? "#f59e0b" : "#ef4444"} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High CLV / High Churn Quadrant */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>High-CLV × High-Churn Quadrant</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>
            Customers in top-right quadrant require immediate CLV-based intervention
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" name="Churn Risk %" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => v + "%"} label={{ value: "Churn Risk %", position: "insideBottom", offset: -5, fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis dataKey="y" name="Predicted CLV" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + v + "L"} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ color: "#ef4444" }}>Churn Risk: {d.x}%</div>
                    <div style={{ color: "#6366f1" }}>CLV: ₹{d.y.toFixed(1)}L</div>
                  </div>
                );
              }} />
              <Scatter data={quadrantData} fill="#6366f1" fillOpacity={0.75} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Churn by segment */}
      <div className="chart-card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Avg Churn Risk by CLV Segment</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {segmentData.map((s, i) => {
            const risk = [8, 18, 24, 32, 58, 45][i];
            const riskColor = risk < 20 ? "#10b981" : risk < 40 ? "#f59e0b" : "#ef4444";
            return (
              <div key={s.name} style={{ flex: "1 0 140px", padding: "14px 16px", background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--foreground)" }}>{s.name}</span>
                  <span className="badge" style={{ background: riskColor + "18", color: riskColor }}>{risk}%</span>
                </div>
                <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${risk}%`, height: "100%", background: riskColor, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 5 }}>{s.customers} customers</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
