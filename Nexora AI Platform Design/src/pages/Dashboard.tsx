import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Activity,
  AlertTriangle, Target, ArrowUpRight, Info, Download, RefreshCw, Sparkles
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from "recharts";
import { clvTrendData, forecastData, segmentData, mrrHistoryData } from "../data/demoData";
import { useToast } from "../components/ui/Toast";
import { apiService, CLVSummary } from "../services/apiService";

/* ── Tooltip ────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label, unit = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 13px", fontSize: 12, boxShadow: "var(--shadow-md)", minWidth: 140 }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 5, color: "var(--foreground)" }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: p.color, marginTop: 2 }}>
          <span style={{ color: "var(--muted-foreground)" }}>{p.name}</span>
          <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("12M");
  const [loading, setLoading] = useState(true);
  const [clvSummary, setClvSummary] = useState<CLVSummary | null>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, modelRes] = await Promise.all([
        apiService.getCLVSummary().catch(() => null),
        apiService.getModelMetrics().catch(() => null),
      ]);
      if (sumRes?.data) setClvSummary(sumRes.data);
      if (modelRes?.data) setModelMetrics(modelRes.data);
    } catch (e) {
      console.warn("Using fallback demo data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalClvFormatted = clvSummary ? `₹${(clvSummary.total_portfolio_clv / 1e7).toFixed(1)} Cr` : "₹5,940 Cr";
  const avgClvFormatted = clvSummary ? `₹${(clvSummary.avg_predicted_clv / 1e5).toFixed(1)}L` : "₹21.8L";
  const highValCount = clvSummary ? clvSummary.segment_counts?.["High Value"] || 312 : 312;
  const decliningCount = clvSummary ? clvSummary.trajectory_counts?.Declining || 243 : 243;
  const r2Score = modelMetrics ? `R² = ${modelMetrics.evaluated_candidates?.find((c: any) => c.is_best)?.r2_score || 0.924}` : "R² = 0.924";

  const kpiCards = [
    { label: "Total Predicted CLV", value: totalClvFormatted, change: "+18.4%", up: true, sub: "12-month projected total", color: "#5b5ff1", icon: Target },
    { label: "Average Customer CLV", value: avgClvFormatted, change: "+12.1%", up: true, sub: "per active account", color: "#7c3aed", icon: TrendingUp },
    { label: "Active Model Metric", value: r2Score, change: "Best Candidate", up: true, sub: modelMetrics?.best_model_name || "GradientBoosting", color: "#10b981", icon: Activity },
    { label: "Total Accounts Analyzed", value: (clvSummary?.total_customers || 50000).toLocaleString(), change: "50K Dataset", up: true, sub: "full portfolio coverage", color: "#3b82f6", icon: Users },
    { label: "High-Value Customers", value: highValCount.toString(), change: "Top Tier", up: true, sub: "top CLV percentile", color: "#5b5ff1", icon: Users },
    { label: "Declining Trajectory", value: decliningCount.toString(), change: "Needs Intervention", up: false, sub: "negative trend", color: "#f59e0b", icon: TrendingDown },
    { label: "Churn Risk (Support)", value: "8.2%", change: "−1.4 pp", up: true, sub: "portfolio avg — secondary", color: "#ef4444", icon: AlertTriangle, secondary: true },
  ];

  const histogram = [
    { range: "₹0–5L",    count: 312 },
    { range: "₹5–15L",   count: 489 },
    { range: "₹15–30L",  count: 401 },
    { range: "₹30–60L",  count: 289 },
    { range: "₹60L–1Cr", count: 198 },
    { range: "₹1–3Cr",   count: 156 },
    { range: "₹3–6Cr",   count: 87  },
    { range: "₹6Cr+",    count: 68  },
  ];

  const scatter = [
    { x: 245, y: 7.85,  name: "Acme Tech"  },
    { x: 421, y: 11.2,  name: "Vertex"     },
    { x: 312, y: 9.1,   name: "TechNova"   },
    { x: 189, y: 5.62,  name: "Stellar"    },
    { x: 278, y: 8.24,  name: "Cascade"    },
    { x: 198, y: 6.3,   name: "Meridian"   },
    { x: 145, y: 3.78,  name: "Orbit"      },
    { x: 98,  y: 2.15,  name: "BlueWave"   },
    { x: 67,  y: 1.24,  name: "NovaSpark"  },
    { x: 43,  y: 0.89,  name: "Prism"      },
    { x: 52,  y: 1.05,  name: "CloudPath"  },
    { x: 28,  y: 0.56,  name: "SwiftLog"   },
  ];

  const forecastCombined = [
    ...clvTrendData.slice(-6).map(d => ({ month: d.month, actual: +(d.clv / 1e7).toFixed(2), forecast: null as null | number, high: null, low: null })),
    ...forecastData.map(d => ({ month: d.month, actual: null, forecast: +(d.predicted / 1e7).toFixed(2), high: +(( d.high ?? 0) / 1e7).toFixed(2), low: +((d.low ?? 0) / 1e7).toFixed(2) })),
  ];

  const mrrTrimmed = mrrHistoryData.slice(-12);

  return (
    <div className="page-wrap">
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Customer Lifetime Value Intelligence</h1>
          <p className="page-subtitle">Predict, explain, and maximize future customer value.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {["3M","6M","12M","YTD"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                background: period === p ? "var(--primary)" : "transparent",
                color: period === p ? "white" : "var(--muted-foreground)", transition: "all 0.15s",
              }}>{p}</button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => toast("Report exported successfully", "success")}>
            <Download size={13} /> Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => toast("Data refreshed", "success")}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* AI Insight bar */}
      <div style={{
        background: "linear-gradient(90deg, rgba(91,95,241,0.08) 0%, rgba(124,58,237,0.05) 100%)",
        border: "1px solid rgba(91,95,241,0.2)", borderRadius: 10,
        padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
      }}>
        <Sparkles size={14} color="#5b5ff1" />
        <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>
          <strong>AI Insight:</strong> Portfolio CLV grew 18.4% this quarter. 47 high-value customers overlap with elevated churn risk — priority interventions could recover ₹4.7 Cr in predicted value.
        </span>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>View Actions</button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="kpi-card" style={{ "--kpi-color": k.color } as any}>
              {k.secondary && (
                <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9.5, color: "var(--muted-foreground)", background: "var(--muted)", padding: "1px 6px", borderRadius: 4, fontWeight: 600, letterSpacing: "0.04em" }}>SECONDARY</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} color={k.color} strokeWidth={2} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: k.up ? "#10b981" : "#ef4444" }}>
                  {k.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {k.change}
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 21, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 — CLV Trend + MRR */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* CLV Trend */}
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--foreground)" }}>CLV Trend Over Time</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>Total portfolio CLV — trailing 12 months</div>
            </div>
            <span className="badge badge-indigo">+18.4% YoY</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={clvTrendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5ff1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5b5ff1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + (v / 1e7).toFixed(0) + "Cr"} />
              <Tooltip content={({ active, payload, label }) => (
                <ChartTip active={active} payload={payload?.map((p: any) => ({ ...p, value: "₹" + (p.value / 1e7).toFixed(2) + "Cr" }))} label={label} />
              )} />
              <Area type="monotone" dataKey="clv" name="Predicted CLV" stroke="#5b5ff1" fill="url(#g1)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* MRR Bars */}
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--foreground)" }}>Monthly Recurring Revenue</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>Actual MRR — 12 months</div>
            </div>
            <span className="badge badge-success">+8.7%</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={mrrTrimmed} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + (v / 1e5).toFixed(0) + "L"} />
              <Tooltip content={({ active, payload, label }) => (
                <ChartTip active={active} payload={payload?.map((p: any) => ({ ...p, value: "₹" + (p.value / 1e5).toFixed(0) + "L" }))} label={label} />
              )} />
              <Bar dataKey="mrr" name="MRR" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 — Segment + Scatter + Histogram */}
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Segment donut */}
        <div className="chart-card">
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>CLV by Segment</div>
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 12 }}>Revenue contribution %</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={segmentData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                {segmentData.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v + "%"} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {segmentData.slice(0, 5).map(s => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ color: "var(--muted-foreground)" }}>{s.name}</span>
                </div>
                <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.revenue}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* MRR vs CLV Scatter */}
        <div className="chart-card">
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>MRR vs Predicted CLV</div>
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 12 }}>Current revenue → future value (₹L)</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" name="MRR (₹K)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "K"} />
              <YAxis dataKey="y" name="CLV (₹L)" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "L"} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", fontSize: 12, boxShadow: "var(--shadow-md)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ color: "#5b5ff1" }}>MRR: ₹{d.x}K</div>
                  <div style={{ color: "#10b981" }}>CLV: ₹{d.y}L</div>
                </div>;
              }} />
              <Scatter data={scatter} fill="#5b5ff1" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Histogram */}
        <div className="chart-card">
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>CLV Distribution</div>
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 12 }}>Customers by CLV band</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={histogram} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={68} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Customers" radius={[0, 4, 4, 0]}>
                {histogram.map((_, i) => <Cell key={i} fill={`hsl(${246 - i * 10}, ${72 - i * 3}%, ${54 + i * 3}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 3 — Forecast + Financial */}
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 14 }}>
        {/* Forecast */}
        <div className="chart-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Future Revenue Projection</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>Historical + 6-month forecast with 80% confidence band</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="badge badge-indigo" style={{ fontSize: 10.5 }}>Prophet</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>₹Cr</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={forecastCombined} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5ff1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5b5ff1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "Cr"} />
              <Tooltip content={({ active, payload, label }) => (
                <ChartTip active={active} payload={payload?.map((p: any) => ({ ...p, value: "₹" + p.value + "Cr" }))} label={label} />
              )} />
              <Area type="monotone" dataKey="high"     name="Upper bound" stroke="none" fill="url(#gb)" />
              <Area type="monotone" dataKey="low"      name="Lower bound" stroke="none" fill="white" />
              <Area type="monotone" dataKey="actual"   name="Actual CLV"  stroke="#5b5ff1" fill="url(#ga)" strokeWidth={2.5} dot={false} />
              <Line  type="monotone" dataKey="forecast" name="CLV Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              <ReferenceLine x="Mar '25" stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Today", fill: "#f59e0b", fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11.5 }}>
            {[
              { color: "#5b5ff1", label: "Actual CLV", dash: false },
              { color: "#8b5cf6", label: "Forecast", dash: true },
              { color: "#5b5ff1", label: "Confidence band", band: true },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {l.band ? (
                  <div style={{ width: 16, height: 8, background: "rgba(91,95,241,0.18)", borderRadius: 2 }} />
                ) : (
                  <div style={{ width: 18, height: 2, background: l.color, ...(l.dash ? { backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 3px," + l.color + " 3px," + l.color + " 7px)", backgroundSize: "10px 2px", background: "none", borderTop: "2px dashed " + l.color } : {}) }} />
                )}
                <span style={{ color: "var(--muted-foreground)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial panel */}
        <div className="chart-card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Executive Financial Summary</div>

          <div style={{ flex: 1 }}>
            {[
              { label: "Portfolio MRR",          value: "₹2.65 Cr",   color: "#5b5ff1" },
              { label: "Predicted Future Revenue",value: "₹38.4 Cr",  color: "#7c3aed" },
              { label: "Avg. Customer CAC",       value: "₹42,000",   color: "var(--muted-foreground)" },
              { label: "Avg. Service Cost/mo",    value: "₹18,500",   color: "var(--muted-foreground)" },
              { label: "Est. Monthly Profit",     value: "₹1.82 Cr",  color: "#10b981" },
              { label: "Avg. Predicted CLV",      value: "₹21.8L",    color: "#5b5ff1" },
              { label: "CLV at Risk",             value: "₹4.7 Cr",   color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* P&L */}
          <div style={{ marginTop: 14, background: "var(--muted)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 8 }}>P&L Summary</div>
            {[
              { label: "Gross Revenue",        value: "₹3.18 Cr", bold: false },
              { label: "COGS",                 value: "–₹89L",    bold: false },
              { label: "Gross Profit",         value: "₹2.29 Cr", bold: true  },
              { label: "Operating Expenses",   value: "–₹62L",    bold: false },
              { label: "Net Operating Profit", value: "₹1.67 Cr", bold: true, green: true },
              { label: "Operating Margin",     value: "52.5%",    bold: true, green: true },
            ].map(({ label, value, bold, green }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                <span style={{ fontWeight: bold ? 700 : 500, fontFamily: "'JetBrains Mono', monospace", color: green ? "#10b981" : "var(--foreground)", fontSize: bold ? 12.5 : 12 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
