import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Activity, Users, DollarSign,
  ShieldCheck, Zap, Star, Trophy, AlertTriangle, CheckCircle,
  XCircle, ArrowUp, ArrowDown, ArrowLeft, RefreshCw,
  BarChart2, Target, Clock, CreditCard, Layers, Compass,
  FileText, Lightbulb, CheckSquare, Sliders, ShieldAlert
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from "recharts";
import { apiService } from "../services/apiService";
import { useToast } from "../components/ui/Toast";

/* ── Status color helper ─────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  positive: "#10b981",
  neutral:  "#f59e0b",
  negative: "#ef4444",
};

/* ── Icon map for milestones ─────────────────────────────── */
const MILESTONE_ICONS: Record<string, any> = {
  trophy:         Trophy,
  star:           Star,
  zap:            Zap,
  shield:         ShieldCheck,
  "trending-up":  TrendingUp,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "x-circle":     XCircle,
  "arrow-up":     ArrowUp,
};

/* ── Custom tooltip ──────────────────────────────────────── */
const ChartTip = ({ active, payload, label, prefix = "", suffix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 14px", fontSize: 12, boxShadow: "var(--shadow-md)" }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 5 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
        </div>
      ))}
    </div>
  );
};

/* ── Change chip ─────────────────────────────────────────── */
const Delta = ({ v, suffix = "%" }: { v: number; suffix?: string }) => {
  const up = v >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12,
      fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      color: up ? "#10b981" : "#ef4444",
      background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
      padding: "2px 8px", borderRadius: 20,
    }}>
      {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {v >= 0 ? "+" : ""}{v}{suffix}
    </span>
  );
};

/* ── KPI card ────────────────────────────────────────────── */
const KpiCard = ({ label, value, delta, deltaLabel, color, icon: Icon, subtitle }: any) => (
  <div className="card" style={{ padding: "16px 18px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>{label}</div>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} color={color} />
      </div>
    </div>
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.025em", marginBottom: 4 }}>{value}</div>
    {delta !== undefined && <Delta v={delta} />}
    {subtitle && <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 5 }}>{subtitle}</div>}
  </div>
);

/* ── Signal pill ─────────────────────────────────────────── */
const Signal = ({ label, value, detail, status }: any) => {
  const c = STATUS_COLOR[status] || "#6b7280";
  return (
    <div style={{ padding: "13px 15px", borderRadius: 11, border: `1px solid ${c}30`, background: c + "08", marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: c }}>{value}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{detail}</div>
    </div>
  );
};

/* ── Benchmark row ───────────────────────────────────────── */
const BenchRow = ({ label, customer, avg, unit = "", higherIsBetter = true }: any) => {
  const ratio = avg > 0 ? customer / avg : 1;
  const better = higherIsBetter ? ratio >= 1 : ratio <= 1;
  const fill   = better ? "#10b981" : "#ef4444";
  const pct    = Math.min(100, Math.round(ratio * 50));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <div style={{ display: "flex", gap: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12 }}>
          <span style={{ color: fill }}>{unit}{typeof customer === "number" ? customer.toLocaleString() : customer}</span>
          <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>vs avg {unit}{typeof avg === "number" ? avg.toLocaleString() : avg}</span>
        </div>
      </div>
      <div style={{ height: 5, background: "var(--muted)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: fill, borderRadius: 100, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────── */
export default function IndividualProgress({
  customerId,
  onBack,
}: {
  customerId?: string;
  onBack?: () => void;
}) {
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [inputId,     setInputId]     = useState(customerId || "");
  const [activeTab,   setActiveTab]   = useState<"overview" | "shap" | "recs" | "risk" | "clv_breakdown" | "timeline">("overview");
  const [activeChart, setActiveChart] = useState<"mrr" | "clv" | "health" | "adoption" | "churn">("mrr");
  const { toast } = useToast();

  const loadProgress = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [progRes, analRes] = await Promise.all([
        apiService.getCustomerProgress(id).catch(() => null),
        apiService.getIndividualAnalysis(id).catch(() => null),
      ]);

      const analData = analRes?.data || {};
      const progData = progRes?.data || {};

      if (analData.account_id || progData.account_id) {
        // Merge datasets for complete analysis capability
        const merged = {
          ...progData,
          ...analData,
          current: analData.snapshot ? {
            mrr: analData.snapshot.current_mrr,
            predicted_clv: analData.snapshot.predicted_clv,
            health_score: analData.snapshot.health_score,
            churn_probability: analData.snapshot.churn_probability,
            feature_adoption: analData.snapshot.feature_adoption,
            active_users: analData.snapshot.active_users,
          } : progData.current,
          benchmarks: analData.benchmarks ? {
            avg_mrr: analData.benchmarks.avg_mrr,
            avg_clv: analData.benchmarks.avg_clv,
            avg_health: analData.benchmarks.avg_health,
            avg_churn: analData.benchmarks.avg_churn,
            avg_adoption: analData.benchmarks.avg_adopt,
          } : progData.benchmarks,
          mrr_series: progData.mrr_series || [],
          clv_series: progData.clv_series || [],
          health_series: progData.health_series || [],
          adoption_series: progData.adoption_series || [],
          churn_series: progData.churn_series || [],
          signals: progData.signals || [],
          milestones: progData.milestones || [],
        };
        setData(merged);
      } else {
        toast("Customer not found", "error");
        setData(null);
      }
    } catch (e: any) {
      toast(`Failed to load: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      setInputId(customerId);
      loadProgress(customerId);
    } else {
      setLoading(false);
    }
  }, [customerId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProgress(inputId);
  };

  // Chart tab config
  const CHART_TABS = [
    { id: "mrr",      label: "MRR",       color: "#10b981" },
    { id: "clv",      label: "CLV",       color: "#5b5ff1" },
    { id: "health",   label: "Health",    color: "#3b82f6" },
    { id: "adoption", label: "Adoption",  color: "#7c3aed" },
    { id: "churn",    label: "Churn Risk",color: "#ef4444" },
  ];

  const chartConfig: Record<string, { series: any[]; dataKey: string; prefix?: string; suffix?: string; color: string; label: string }> = {
    mrr:      { series: data?.mrr_series || [],      dataKey: "mrr",       prefix: "₹", color: "#10b981", label: "MRR (₹)" },
    clv:      { series: data?.clv_series || [],      dataKey: "clv",       prefix: "₹", color: "#5b5ff1", label: "Predicted CLV (₹)" },
    health:   { series: data?.health_series || [],   dataKey: "health",    suffix: "",  color: "#3b82f6", label: "Health Score" },
    adoption: { series: data?.adoption_series || [], dataKey: "adoption",  suffix: "%", color: "#7c3aed", label: "Adoption (%)" },
    churn:    { series: data?.churn_series || [],    dataKey: "churn_pct", suffix: "%", color: "#ef4444", label: "Churn Risk (%)" },
  };

  const activeChartObj = chartConfig[activeChart];

  return (
    <div className="page-wrap">
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onBack}>
              <ArrowLeft size={15} />
            </button>
          )}
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#5b5ff1,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={18} color="white" />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {data ? `${data.account_name} — Individual Analysis` : "Individual Customer Analysis"}
            </h1>
            <p className="page-subtitle">
              {data
                ? `${data.industry || 'B2B SaaS'} · ${data.tier || 'Enterprise'} · ${data.tenure_months || 12}mo tenure · ${data.clv_segment || 'High Value'}`
                : "Search by Account ID to perform deep individual analytics and XAI attribution"}
            </p>
          </div>
        </div>
        {data && (
          <button className="btn btn-secondary btn-sm" onClick={() => loadProgress(String(data.account_id))}>
            <RefreshCw size={13} /> Refresh
          </button>
        )}
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          placeholder="Enter Account ID (e.g. 1, 42, 1001)…"
          className="input"
          style={{ maxWidth: 340, fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? <RefreshCw size={13} className="spin" /> : <Activity size={13} />}
          {loading ? "Loading…" : "Analyse Account"}
        </button>
      </form>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, flexDirection: "column", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Running deep customer attribution & risk profiling…</span>
        </div>
      )}

      {/* ── No data state ── */}
      {!loading && !data && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <BarChart2 size={42} color="var(--muted-foreground)" style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Enter an Account ID to begin individual analysis</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 500, margin: "0 auto" }}>
            Generates SHAP local feature attributions, custom AI action recommendations, composite 5-dimension risk profiling, CLV value decomposition, and 6-month trajectory trends.
          </div>
        </div>
      )}

      {/* ── Data view ── */}
      {!loading && data && (
        <>
          {/* ── Trajectory + segment badges ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`badge ${data.clv_trajectory === "Increasing" ? "badge-success" : data.clv_trajectory === "Declining" ? "badge-danger" : "badge-warning"}`}>
              {data.clv_trajectory === "Increasing" ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {data.clv_trajectory || "Stable"}
            </span>
            <span className="badge badge-indigo">{data.clv_segment || "Core Account"}</span>
            {data.risk_profile?.risk_label && (
              <span className="badge" style={{ background: `${data.risk_profile.risk_color}20`, color: data.risk_profile.risk_color, border: `1px solid ${data.risk_profile.risk_color}40` }}>
                <ShieldAlert size={10} /> {data.risk_profile.risk_label} ({data.risk_profile.composite_score}/100)
              </span>
            )}
            <span className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Clock size={9} /> {data.tenure_months}mo tenure
            </span>
            <span className="badge" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              {data.regime_state || "Expansion"}
            </span>
          </div>

          {/* ── KPI strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            <KpiCard
              label="Current MRR"
              value={`₹${((data.current?.mrr || data.snapshot?.current_mrr || 0) / 1000).toFixed(1)}K`}
              delta={data.changes?.mrr_pct}
              subtitle={`Portfolio avg ₹${((data.benchmarks?.avg_mrr || 0) / 1000).toFixed(1)}K`}
              color="#10b981"
              icon={DollarSign}
            />
            <KpiCard
              label="Predicted CLV"
              value={`₹${((data.current?.predicted_clv || data.snapshot?.predicted_clv || 0) / 100000).toFixed(2)}L`}
              delta={data.changes?.clv_pct}
              subtitle={`Portfolio avg ₹${((data.benchmarks?.avg_clv || 0) / 100000).toFixed(2)}L`}
              color="#5b5ff1"
              icon={Target}
            />
            <KpiCard
              label="Health Score"
              value={data.current?.health_score || data.snapshot?.health_score || 0}
              delta={data.changes?.health_delta}
              deltaLabel=" vs 6m ago"
              subtitle={`Portfolio avg ${data.benchmarks?.avg_health || 70}`}
              color="#3b82f6"
              icon={Activity}
            />
            <KpiCard
              label="Active Users"
              value={data.current?.active_users || data.snapshot?.active_users || 0}
              subtitle={`Adoption: ${((data.current?.feature_adoption || data.snapshot?.feature_adoption || 0) * 100).toFixed(0)}%`}
              color="#7c3aed"
              icon={Users}
            />
          </div>

          {/* ── Sub-navigation Tabs ── */}
          <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--border)", marginBottom: 18, paddingBottom: 2 }}>
            {[
              { id: "overview",       label: "Trajectory Trends", icon: TrendingUp },
              { id: "shap",           label: "SHAP XAI Waterfall", icon: Layers },
              { id: "recs",           label: "AI Action Plan",    icon: Lightbulb },
              { id: "risk",           label: "Risk & Payment",    icon: ShieldAlert },
              { id: "clv_breakdown",  label: "CLV Breakdown",     icon: Target },
              { id: "timeline",       label: "Lifecycle Timeline",icon: Compass },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: "8px 8px 0 0",
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                    background: isActive ? "rgba(91,95,241,0.08)" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === "recs" && data.recommendations?.length > 0 && (
                    <span style={{ fontSize: 10, background: "#f59e0b", color: "white", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                      {data.recommendations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: TRAJECTORY TRENDS ── */}
          {activeTab === "overview" && (
            <>
              {/* Main chart + signals */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
                {/* Chart panel */}
                <div className="chart-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>6-Month Trajectory</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{activeChartObj.label} — trailing 6 months</div>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {CHART_TABS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveChart(t.id as any)}
                          style={{
                            padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                            border: "1px solid var(--border)",
                            background: activeChart === t.id ? t.color : "var(--muted)",
                            color: activeChart === t.id ? "white" : "var(--muted-foreground)",
                            transition: "all 0.15s",
                          }}
                        >{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={activeChartObj.series} margin={{ left: -5, right: 4 }}>
                      <defs>
                        <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={activeChartObj.color} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={activeChartObj.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                        tickFormatter={v => (activeChartObj.prefix || "") + (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v) + (activeChartObj.suffix || "")} />
                      <Tooltip content={(props) => <ChartTip {...props} prefix={activeChartObj.prefix} suffix={activeChartObj.suffix} />} />
                      <Area type="monotone" dataKey={activeChartObj.dataKey} name={activeChartObj.label}
                        stroke={activeChartObj.color} fill="url(#progGrad)" strokeWidth={2.5} dot={{ fill: activeChartObj.color, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Signal cards */}
                <div className="chart-card" style={{ overflowY: "auto" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Performance Signals</div>
                  {(data.signals || []).map((s: any) => (
                    <Signal key={s.label} {...s} />
                  ))}
                  {(!data.signals || data.signals.length === 0) && (
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", padding: "16px 0", textAlign: "center" }}>
                      No negative drift detected. Account operating normally.
                    </div>
                  )}
                </div>
              </div>

              {/* Benchmarks + Milestones */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
                {/* Portfolio benchmarks */}
                <div className="chart-card">
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>Portfolio Benchmark Comparison</div>
                  <BenchRow
                    label="Monthly Recurring Revenue"
                    customer={Math.round(data.current?.mrr || data.snapshot?.current_mrr || 0)}
                    avg={Math.round(data.benchmarks?.avg_mrr || 0)}
                    unit="₹"
                    higherIsBetter
                  />
                  <BenchRow
                    label="Predicted CLV"
                    customer={Math.round(data.current?.predicted_clv || data.snapshot?.predicted_clv || 0)}
                    avg={Math.round(data.benchmarks?.avg_clv || 0)}
                    unit="₹"
                    higherIsBetter
                  />
                  <BenchRow
                    label="Health Score"
                    customer={data.current?.health_score || data.snapshot?.health_score || 0}
                    avg={data.benchmarks?.avg_health || 70}
                    higherIsBetter
                  />
                  <BenchRow
                    label="Feature Adoption"
                    customer={Math.round((data.current?.feature_adoption || data.snapshot?.feature_adoption || 0) * 100)}
                    avg={Math.round((data.benchmarks?.avg_adoption || 0.5) * 100)}
                    unit="%"
                    higherIsBetter
                  />
                  <BenchRow
                    label="Churn Risk"
                    customer={Math.round((data.current?.churn_probability || data.snapshot?.churn_probability || 0) * 100)}
                    avg={Math.round((data.benchmarks?.avg_churn || 0.2) * 100)}
                    unit="%"
                    higherIsBetter={false}
                  />
                </div>

                {/* Milestones */}
                <div className="chart-card">
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Customer Milestones</div>
                  {(!data.milestones || data.milestones.length === 0) && (
                    <div style={{ fontSize: 13, color: "var(--muted-foreground)", padding: "20px 0", textAlign: "center" }}>
                      No milestones recorded yet
                    </div>
                  )}
                  {(data.milestones || []).map((m: any, i: number) => {
                    const Icon = MILESTONE_ICONS[m.icon] || Star;
                    const color = m.achieved ? "#10b981" : "#ef4444";
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 9, marginBottom: 7,
                        border: `1px solid ${color}25`,
                        background: color + "08",
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={13} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {m.achieved ? "✓ Achieved" : "✗ Alert"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: SHAP XAI WATERFALL ── */}
          {activeTab === "shap" && (
            <div className="chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Local SHAP Feature Attribution</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                    Base value (Portfolio Mean): <strong>₹{data.shap?.base_value ? data.shap.base_value.toLocaleString() : 'N/A'}</strong> → Final Predicted CLV: <strong>₹{data.snapshot?.predicted_clv ? data.snapshot.predicted_clv.toLocaleString() : 'N/A'}</strong>
                  </div>
                </div>
                <span className="badge badge-indigo">
                  {data.shap?.method || "TreeExplainer Local Attribution"}
                </span>
              </div>

              {data.shap?.waterfall && data.shap.waterfall.length > 0 ? (
                <div style={{ margin: "20px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.shap.waterfall.map((d: any, i: number) => {
                      const isPos = d.shap_value >= 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5 }}>
                          <div style={{ width: 180, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.feature}
                          </div>
                          <div style={{ width: 90, fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                            Val: {typeof d.feature_value === "number" ? d.feature_value.toFixed(2) : d.feature_value}
                          </div>
                          <div style={{ flex: 1, position: "relative", height: 22, background: "var(--muted)", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "center" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, Math.abs(d.shap_value) / 1000)}%`,
                                background: isPos ? "#10b981" : "#ef4444",
                                borderRadius: 4,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <div style={{ width: 100, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isPos ? "#10b981" : "#ef4444" }}>
                            {isPos ? "+" : ""}{d.shap_value.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 30, textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
                  SHAP local explanation parameters being computed from active model tree ensemble.
                </div>
              )}
              {data.shap?.note && (
                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--muted)", fontSize: 11.5, color: "var(--muted-foreground)" }}>
                  💡 {data.shap.note}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: AI RECOMMENDATIONS ── */}
          {activeTab === "recs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(data.recommendations || []).map((rec: any, idx: number) => (
                <div key={idx} className="chart-card" style={{ borderLeft: `4px solid ${rec.color || "#3b82f6"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="badge" style={{ background: `${rec.color}20`, color: rec.color, border: `1px solid ${rec.color}40`, fontWeight: 700 }}>
                        {rec.priority} Priority
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{rec.action}</h3>
                    </div>
                    {rec.impact && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 20 }}>
                        Target Impact: {rec.impact}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>
                    <strong>Trigger Reason:</strong> {rec.reason}
                  </p>
                  <div style={{ background: "var(--muted)", padding: "12px 16px", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground)" }}>
                      Recommended Action Steps:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7, color: "var(--foreground)" }}>
                      {rec.steps?.map((step: string, sIdx: number) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB 4: RISK PROFILE & PAYMENT ── */}
          {activeTab === "risk" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Composite risk breakdown */}
              <div className="chart-card">
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>5-Dimension Composite Risk Score</div>
                {data.risk_profile ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{
                        width: 70, height: 70, borderRadius: "50%",
                        border: `4px solid ${data.risk_profile.risk_color}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: data.risk_profile.risk_color, fontFamily: "'JetBrains Mono', monospace" }}>
                          {data.risk_profile.composite_score}
                        </span>
                        <span style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Score</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: data.risk_profile.risk_color }}>
                          {data.risk_profile.risk_label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                          Riskier than {data.risk_profile.percentile}% of portfolio accounts
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {data.risk_profile.dimensions?.map((dim: any, i: number) => (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span>{dim.label} <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>({dim.weight})</span></span>
                            <span style={{ fontWeight: 700, color: dim.color, fontFamily: "'JetBrains Mono', monospace" }}>
                              {dim.score}%
                            </span>
                          </div>
                          <div style={{ height: 6, background: "var(--muted)", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${dim.score}%`, background: dim.color, borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Risk profile calculating…</div>
                )}
              </div>

              {/* Payment Profile */}
              <div className="chart-card">
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Payment & Financial Health</div>
                {data.payment_profile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: "var(--muted)" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Payment Rating</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: data.payment_profile.rating_color }}>
                          {data.payment_profile.rating}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Delay Rate</div>
                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                          {data.payment_profile.delay_rate_pct}%
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Contract Type</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{data.payment_profile.contract_type}</div>
                      </div>
                      <div style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Active Discount</div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{data.payment_profile.discount_pct}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Payment profile loading…</div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: CLV BREAKDOWN ── */}
          {activeTab === "clv_breakdown" && (
            <div className="chart-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>CLV Value Decomposition</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 16 }}>
                Constituent revenue and risk drivers shaping the predicted CLV of <strong>₹{data.clv_breakdown?.predicted_clv?.toLocaleString() || data.current?.predicted_clv?.toLocaleString() || '0'}</strong>
              </div>

              {data.clv_breakdown?.components ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.clv_breakdown.components.map((comp: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 9, background: "var(--muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: comp.color }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{comp.label}</span>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: comp.value >= 0 ? "var(--foreground)" : "#ef4444" }}>
                        {comp.value >= 0 ? "+" : ""}₹{comp.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>CLV decomposition unavailable for this account.</div>
              )}
            </div>
          )}

          {/* ── TAB 6: LIFECYCLE TIMELINE ── */}
          {activeTab === "timeline" && (
            <div className="chart-card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Customer Lifecycle & Event Timeline</div>
              {data.timeline && data.timeline.length > 0 ? (
                <div style={{ position: "relative", paddingLeft: 24, borderLeft: "2px solid var(--border)", display: "flex", flexDirection: "column", gap: 18 }}>
                  {data.timeline.map((ev: any, idx: number) => {
                    const iconColor = ev.type === "danger" ? "#ef4444" : ev.type === "warning" ? "#f59e0b" : ev.type === "success" ? "#10b981" : "#3b82f6";
                    return (
                      <div key={idx} style={{ position: "relative" }}>
                        <div style={{
                          position: "absolute", left: -31, top: 2,
                          width: 12, height: 12, borderRadius: "50%",
                          background: iconColor, border: "2px solid var(--card)",
                        }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                            {ev.month === 0 ? "Current" : `Month ${ev.month}`}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.event}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{ev.detail}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No timeline events logged.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
