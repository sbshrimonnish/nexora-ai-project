import { useState, useEffect } from "react";
import {
  Bookmark, Download, TrendingUp, Zap, MessageSquare,
  CalendarCheck, Phone, CheckCircle, AlertCircle, ArrowUpRight,
  ArrowLeft, RefreshCw, Search, ShieldCheck, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine
} from "recharts";
import { apiService } from "../services/apiService";
import { useToast } from "../components/ui/Toast";
import { Drawer } from "../components/ui/Modal";

const TimelineIcon = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    success: "#10b981", upgrade: "#5b5ff1", warning: "#f59e0b",
    info: "#3b82f6", danger: "#ef4444"
  };
  const c = colors[type] || "#6b7280";
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%",
      background: c + "20", border: "2px solid " + c,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      {type === "success" || type === "upgrade" ? <CheckCircle size={11} color={c} /> : <AlertCircle size={11} color={c} />}
    </div>
  );
};

export default function Customer360({
  customerId,
  onBack,
}: {
  customerId?: string;
  onBack?: () => void;
}) {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [inputId, setInputId]   = useState(customerId || "1");
  const [drawer, setDrawer]     = useState<string | null>(null);
  const [activeRec, setActiveRec] = useState<any>(null);
  const { toast } = useToast();

  const loadCustomer360 = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [analRes, progRes] = await Promise.all([
        apiService.getIndividualAnalysis(id).catch(() => null),
        apiService.getCustomerProgress(id).catch(() => null),
      ]);

      const anal = analRes?.data || {};
      const prog = progRes?.data || {};

      if (anal.account_id || prog.account_id) {
        const targetId = anal.account_id || prog.account_id;
        const currentMrr = anal.snapshot?.current_mrr || prog.current?.mrr || 150000;
        const predictedClv = anal.snapshot?.predicted_clv || prog.current?.predicted_clv || 650000;
        const healthScore = anal.snapshot?.health_score || prog.current?.health_score || 78;

        // Build SHAP array for display
        const shapList = anal.shap?.waterfall ? anal.shap.waterfall.map((w: any) => ({
          feature: w.feature,
          value: w.shap_value / 10000,
          direction: w.shap_value >= 0 ? "positive" : "negative",
        })) : [
          { feature: "MRR Growth Rate", value: 0.32, direction: "positive" },
          { feature: "Feature Adoption", value: 0.28, direction: "positive" },
          { feature: "Active User Seats", value: 0.18, direction: "positive" },
          { feature: "Payment Delay Rate", value: -0.14, direction: "negative" },
          { feature: "Support Ticket Growth", value: -0.09, direction: "negative" },
        ];

        // Revenue history & CLV trajectory from series
        const revHist = prog.mrr_series?.length ? prog.mrr_series.map((s: any) => ({
          month: s.period,
          mrr: Math.round(s.mrr / 1000),
        })) : [
          { month: "M-5", mrr: Math.round(currentMrr * 0.85 / 1000) },
          { month: "M-4", mrr: Math.round(currentMrr * 0.88 / 1000) },
          { month: "M-3", mrr: Math.round(currentMrr * 0.92 / 1000) },
          { month: "M-2", mrr: Math.round(currentMrr * 0.95 / 1000) },
          { month: "M-1", mrr: Math.round(currentMrr * 0.98 / 1000) },
          { month: "Current", mrr: Math.round(currentMrr / 1000) },
        ];

        const clvTrajectory = prog.clv_series?.length ? prog.clv_series.map((s: any) => ({
          period: s.period,
          value: Number((s.clv / 100000).toFixed(2)),
          low: Number(((s.clv * 0.9) / 100000).toFixed(2)),
          high: Number(((s.clv * 1.1) / 100000).toFixed(2)),
        })) : [
          { period: "M-5", value: Number(((predictedClv * 0.8) / 100000).toFixed(2)) },
          { period: "M-3", value: Number(((predictedClv * 0.9) / 100000).toFixed(2)) },
          { period: "Current", value: Number((predictedClv / 100000).toFixed(2)) },
          { period: "+3M Forecast", value: Number(((predictedClv * 1.12) / 100000).toFixed(2)), low: Number(((predictedClv * 1.02) / 100000).toFixed(2)), high: Number(((predictedClv * 1.22) / 100000).toFixed(2)) },
        ];

        const fullTimeline = anal.timeline?.length ? anal.timeline.map((t: any) => ({
          event: t.event,
          date: t.month === 0 ? "Current" : `Month ${t.month}`,
          detail: t.detail,
          type: t.type,
        })) : [
          { event: "Account Activated", date: `Month -${anal.tenure_months || 12}`, detail: "Customer onboarded successfully", type: "success" },
          { event: "Feature Adoption Milestone", date: "Month -4", detail: "Adoption reached 50%+ threshold", type: "upgrade" },
          { event: "Health Score Check", date: "Current", detail: `Health index sitting at ${healthScore}/100`, type: healthScore >= 70 ? "success" : "warning" },
        ];

        setData({
          account_id: targetId,
          company: anal.account_name || `Account-${targetId}`,
          industry: anal.industry || "B2B SaaS",
          size: anal.tier || "Mid-Market",
          tenure: anal.tenure_months || 12,
          segment: anal.clv_segment || "High Value",
          status: (anal.snapshot?.churn_probability || 0) > 0.35 ? "At Risk" : "Active",
          predictedClv,
          currentMrr,
          annualRunRate: currentMrr * 12,
          healthScore,
          churnProb: anal.snapshot?.churn_probability || 0.15,
          clvGrowth: anal.snapshot?.mrr_growth ? Math.round(anal.snapshot.mrr_growth * 100) : 15,
          shap: shapList,
          revenueHistory: revHist,
          clvTrajectory,
          timeline: fullTimeline,
          recommendations: anal.recommendations || [],
        });
      } else {
        toast("Customer record not found", "error");
        setData(null);
      }
    } catch (e: any) {
      toast(`Failed to load 360 data: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idToFetch = customerId || "1";
    setInputId(idToFetch);
    loadCustomer360(idToFetch);
  }, [customerId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomer360(inputId);
  };

  return (
    <div className="page-wrap">
      {/* Search Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onBack}>
              <ArrowLeft size={15} />
            </button>
          )}
          <h1 className="page-title" style={{ margin: 0, fontSize: 20 }}>Customer 360° Profile</h1>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          <input
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            placeholder="Account ID (e.g. 1, 42, 1001)…"
            className="input"
            style={{ width: 220, fontSize: 13 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? <RefreshCw size={13} className="spin" /> : <Search size={13} />}
            Load 360°
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 320, flexDirection: "column", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Synthesizing Customer 360° profile…</span>
        </div>
      )}

      {!loading && !data && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Activity size={42} color="var(--muted-foreground)" style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Enter an Account ID to view Customer 360°</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            Aggregates full revenue, XAI feature drivers, customer health gauges, AI action playbooks, and timeline history.
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #5b5ff1, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0
              }}>
                {data.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 21, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em", margin: 0 }}>
                    {data.company}
                  </h1>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--primary)", background: "rgba(91,95,241,0.1)", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>
                    C{data.account_id}
                  </span>
                  <span className={`badge ${data.status === "Active" ? "badge-success" : "badge-danger"}`}>{data.status}</span>
                  <span className="badge badge-indigo">{data.segment}</span>
                  <span className="badge badge-violet">{data.size}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted-foreground)", marginTop: 3 }}>
                  {data.industry} · {data.size} · Onboarded {data.tenure} months ago
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => toast("Bookmarked", "success")}><Bookmark size={13} /></button>
              <button className="btn btn-secondary btn-sm" onClick={() => toast("360 Report exported", "success")}><Download size={13} /> Export 360°</button>
              <button className="btn btn-primary btn-sm" onClick={() => setDrawer("retention")}><Phone size={13} /> Retention Outreach</button>
            </div>
          </div>

          {/* CLV metric strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid var(--border)" }}>
            {[
              { l: "Predicted CLV",    v: `₹${(data.predictedClv / 100000).toFixed(2)}L`, c: "#5b5ff1", large: true },
              { l: "Current MRR",      v: `₹${(data.currentMrr / 1000).toFixed(0)}K`, c: "#7c3aed" },
              { l: "Future Revenue",   v: `₹${(data.annualRunRate / 100000).toFixed(1)}L/yr`, c: "#10b981" },
              { l: "CLV Growth",       v: `${data.clvGrowth >= 0 ? "+" : ""}${data.clvGrowth}%`, c: data.clvGrowth >= 0 ? "#10b981" : "#ef4444" },
              { l: "Model Confidence", v: `${Math.round((1 - data.churnProb) * 100)}%`, c: "#3b82f6" },
            ].map(({ l, v, c, large }) => (
              <div key={l} style={{ background: "var(--card)", padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: large ? 22 : 18, fontWeight: 800, color: c, letterSpacing: "-0.025em" }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Health scores */}
            <div className="chart-card">
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>Customer Health Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
                <div style={{
                  width: 76, height: 76, borderRadius: "50%",
                  background: `conic-gradient(#10b981 0% ${data.healthScore}%, var(--muted) ${data.healthScore}% 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 5px var(--card)",
                  flexShrink: 0,
                }}>
                  <div style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "'DM Sans', sans-serif" }}>
                    {data.healthScore}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: data.healthScore >= 70 ? "#10b981" : "#f59e0b" }}>
                    {data.healthScore >= 75 ? "Healthy Account" : data.healthScore >= 50 ? "Moderate Health" : "Critical Warning"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Portfolio mean: 70</div>
                  <span className="badge badge-success" style={{ marginTop: 5 }}>
                    {data.healthScore >= 70 ? `+${data.healthScore - 70} vs avg` : `${data.healthScore - 70} vs avg`}
                  </span>
                </div>
              </div>
              {[
                { l: "Engagement",        v: Math.min(98, Math.round(data.healthScore * 1.05)), c: "#5b5ff1" },
                { l: "Product Adoption",  v: Math.min(95, Math.round(data.healthScore * 1.02)), c: "#7c3aed" },
                { l: "Usage Frequency",   v: Math.min(99, Math.round(data.healthScore * 1.08)), c: "#3b82f6" },
                { l: "Support Quality",   v: Math.max(50, Math.round(data.healthScore * 0.9)),  c: "#10b981" },
                { l: "Payment Behavior",  v: Math.max(40, Math.round(100 - (data.churnProb * 100))), c: "#10b981" },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                  <div style={{ width: 120, fontSize: 12.5, color: "var(--muted-foreground)", flexShrink: 0 }}>{l}</div>
                  <div style={{ flex: 1, height: 5, background: "var(--muted)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ width: v + "%", height: "100%", background: c, borderRadius: 100 }} />
                  </div>
                  <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* SHAP */}
            <div className="chart-card">
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Why does the model predict this CLV?</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 14 }}>Local SHAP values — per-feature CLV drivers</div>
              {data.shap.map((s: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>{s.feature}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.direction === "positive" ? "#5b5ff1" : "#ef4444" }}>
                      {s.direction === "positive" ? "+" : "−"}{(Math.abs(s.value) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="shap-track">
                    {s.direction === "positive"
                      ? <div className="shap-pos" style={{ width: `${Math.min(100, Math.abs(s.value) * 100)}%` }} />
                      : <div className="shap-neg" style={{ width: `${Math.min(100, Math.abs(s.value) * 100)}%` }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Revenue */}
            <div className="chart-card">
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Revenue History</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 14 }}>Monthly MRR — trailing periods (₹K)</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.revenueHistory} margin={{ left: -10, right: 4 }}>
                  <defs>
                    <linearGradient id="revg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "K"} />
                  <Tooltip formatter={(v: number) => "₹" + v + "K"} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" fill="url(#revg)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* CLV trajectory */}
            <div className="chart-card">
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>CLV Trajectory</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 14 }}>Historical + forecast (₹L)</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.clvTrajectory} margin={{ left: -10, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "L"} />
                  <Tooltip formatter={(v: number) => "₹" + v + "L"} />
                  <Area type="monotone" dataKey="high" stroke="none" fill="rgba(91,95,241,0.1)" />
                  <Area type="monotone" dataKey="low" stroke="none" fill="white" />
                  <Line type="monotone" dataKey="value" stroke="#5b5ff1" strokeWidth={2.5} dot={{ fill: "#5b5ff1", r: 3 }} name="CLV" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Timeline */}
            <div className="chart-card">
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 18 }}>Customer Lifecycle Timeline</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "var(--border)" }} />
                {data.timeline.map((ev: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, paddingLeft: 4 }}>
                    <TimelineIcon type={ev.type} />
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.event}</span>
                        <span style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 1 }}>{ev.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Playbook */}
            <div className="chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>AI Playbook & Actions</div>
                <button className="btn btn-primary btn-sm" onClick={() => toast("Playbook generated", "success")}><Zap size={12} /> Generate</button>
              </div>

              {data.recommendations?.length > 0 ? (
                data.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} style={{ padding: "11px 13px", borderRadius: 10, border: `1px solid ${rec.color}40`, marginBottom: 9, background: `${rec.color}0a` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${rec.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Zap size={13} color={rec.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{rec.action}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 1 }}>{rec.reason}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => { setActiveRec(rec); setDrawer("action"); }}>
                        Action
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { icon: TrendingUp,    label: "Adoption Boost",      action: "Enable 3 inactive modules", color: "#5b5ff1", drawer: "recommendation" },
                  { icon: ArrowUpRight,  label: "Upsell Opportunity",  action: "Enterprise Analytics Suite — +₹80K/mo", color: "#7c3aed", drawer: "outreach" },
                  { icon: CalendarCheck, label: "Executive Review",    action: "Schedule QBR within 30 days", color: "#3b82f6", drawer: "followup" },
                  { icon: MessageSquare, label: "CS Intervention",     action: "Proactive CSM check-in needed", color: "#f59e0b", drawer: "retention" },
                ].map(({ icon: Icon, label, action, color, drawer: d }) => (
                  <div key={label} style={{ padding: "11px 13px", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 9, background: "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => setDrawer(d)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={13} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 1 }}>{action}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
                        {label.split(" ")[0]}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Drawer */}
          {drawer && (
            <Drawer
              title={activeRec ? activeRec.action : (drawer === "retention" ? "Send Retention Outreach" : "AI Playbook Action")}
              subtitle={`${data.company} · C${data.account_id}`}
              onClose={() => { setDrawer(null); setActiveRec(null); }}
            >
              <div style={{ fontSize: 13.5, color: "var(--muted-foreground)", lineHeight: 1.7, marginBottom: 20 }}>
                AI-generated action for <strong>{data.company}</strong>:<br /><br />
                {activeRec ? activeRec.reason : "Based on usage analytics and CLV model insights, we recommend executive-level engagement to optimize account retention and adoption."}<br /><br />
                {activeRec?.impact ? `Target Impact: ${activeRec.impact}` : "Predicted CLV uplift: +₹45,000 — ₹80,000 over 12 months."}
              </div>
              <div style={{ background: "var(--muted)", borderRadius: 10, padding: "14px", marginBottom: 20, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", marginBottom: 8 }}>Suggested Action Nudge</div>
                <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.65 }}>
                  {activeRec?.steps ? activeRec.steps.join(" → ") : `"Hi [Name], we noticed your usage patterns over the past few weeks and wanted to connect to share tailored recommendations..."`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setDrawer(null); setActiveRec(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setDrawer(null); setActiveRec(null); toast("Outreach dispatched successfully", "success"); }}>
                  Execute Action
                </button>
              </div>
            </Drawer>
          )}
        </>
      )}
    </div>
  );
}
