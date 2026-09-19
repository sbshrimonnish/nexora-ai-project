import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { forecastData, mrrHistoryData, clvTrendData } from "../data/demoData";

const horizons = ["3 Months", "6 Months", "12 Months", "4 Quarters"];

const quarterlyData = [
  { quarter: "Q1 '24", arr: 24000000, forecast: null },
  { quarter: "Q2 '24", arr: 26000000, forecast: null },
  { quarter: "Q3 '24", arr: 28000000, forecast: null },
  { quarter: "Q4 '24", arr: 31000000, forecast: null },
  { quarter: "Q1 '25", arr: null, forecast: 34000000, low: 31000000, high: 37000000 },
  { quarter: "Q2 '25", arr: null, forecast: 37500000, low: 33500000, high: 41500000 },
];

export default function RevenueForecast() {
  const [horizon, setHorizon] = useState("6 Months");
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };

  const combined = [
    ...clvTrendData.slice(-6).map(d => ({ month: d.month, actual: d.clv, mrr: d.mrr })),
    ...forecastData.map(d => ({ month: d.month, forecast: d.predicted, low: d.low, high: d.high, mrr: null })),
  ];

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">Future Revenue & CLV Forecast</h1>
            <p className="page-subtitle">Prophet forecasting model · Historical + projected revenue and CLV</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              {horizons.map(h => (
                <button key={h} onClick={() => setHorizon(h)} style={{
                  padding: "7px 14px", border: "none", cursor: "pointer", fontSize: 12.5,
                  background: horizon === h ? "var(--primary)" : "transparent",
                  color: horizon === h ? "white" : "var(--muted-foreground)", transition: "all 0.15s",
                }}>{h}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={refresh} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              {loading ? "Refreshing…" : "Refresh Forecast"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Current MRR", value: "₹2.65 Cr" },
          { label: "Historical ARR", value: "₹31.8 Cr" },
          { label: "Future ARR (Forecast)", value: "₹38.4 Cr", accent: true },
          { label: "Predicted CLV (Total)", value: "₹5,940 Cr" },
          { label: "Forecast Range", value: "±₹3.2 Cr" },
          { label: "Horizon", value: horizon },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14.5, fontWeight: 700, color: accent ? "#6366f1" : "var(--foreground)" }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[220, 200].map((h, i) => (
            <div key={i} className="chart-card">
              <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: h }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Revenue + CLV forecast */}
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Monthly Revenue & CLV Forecast</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Actual (solid) + Prophet forecast (dashed) with confidence band</div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 2, background: "#6366f1" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>Actual CLV</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 2, background: "#8b5cf6", borderTop: "2px dashed #8b5cf6", borderBottom: "none" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>Forecast</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 20, height: 10, background: "rgba(99,102,241,0.15)", borderRadius: 2 }} />
                    <span style={{ color: "var(--muted-foreground)" }}>Confidence</span>
                  </div>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={combined}>
                <defs>
                  <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 10000000).toFixed(0) + "Cr"} />
                <Tooltip formatter={(v: number) => "₹" + (v / 10000000).toFixed(2) + "Cr"} />
                <Area type="monotone" dataKey="high" stroke="none" fill="url(#fg2)" name="Upper bound" />
                <Area type="monotone" dataKey="low" stroke="none" fill="white" name="Lower bound" />
                <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#fg1)" strokeWidth={2.5} dot={false} name="Actual CLV" />
                <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={false} name="CLV Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quarterly ARR */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="chart-card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Quarterly ARR Forecast</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Actual + Q1–Q2 2025 forecast</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 10000000).toFixed(0) + "Cr"} />
                  <Tooltip formatter={(v: number) => "₹" + (v / 10000000).toFixed(1) + "Cr"} />
                  <Bar dataKey="arr" name="Actual ARR" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="forecast" name="Forecast ARR" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>MRR Growth Trend</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Monthly MRR — trailing 12 months</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mrrHistoryData}>
                  <defs>
                    <linearGradient id="mrrFg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Tooltip formatter={(v: number) => "₹" + (v / 100000).toFixed(0) + "L"} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" fill="url(#mrrFg)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
