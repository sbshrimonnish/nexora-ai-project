import { useState } from "react";
import { TrendingUp, Zap, ArrowRight, ChevronDown, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, ReferenceLine } from "recharts";
import { shapData } from "../data/demoData";
import { useToast } from "../components/ui/Toast";
import { Modal } from "../components/ui/Modal";

const HORIZONS = ["12 Months", "24 Months", "36 Months", "Custom"];

const trajectory = [
  { period: "Mar '23", clv: 2.8,  type: "hist" },
  { period: "Sep '23", clv: 3.9,  type: "hist" },
  { period: "Mar '24", clv: 5.1,  type: "hist" },
  { period: "Sep '24", clv: 6.2,  type: "current" },
  { period: "Mar '25", clv: 7.85, type: "forecast", low: 6.9, high: 8.6  },
  { period: "Sep '25", clv: 9.4,  type: "forecast", low: 8.1, high: 10.7 },
  { period: "Mar '26", clv: 11.2, type: "forecast", low: 9.5, high: 13.1 },
];

const modelInputs = [
  { f: "Monthly Spend",    v: "₹2,45,000", note: "Top 8% of portfolio" },
  { f: "Tenure",           v: "38 months",  note: "3.2 years" },
  { f: "Usage Frequency",  v: "Daily active",note: "94th percentile" },
  { f: "Product Adoption", v: "87%",        note: "7/8 modules active" },
  { f: "Support Activity", v: "2.1 tickets/mo",note: "Below average ✓" },
  { f: "Revenue Trend",    v: "+14.2% YoY", note: "Positive" },
  { f: "Sentiment Score",  v: "8.4 / 10",   note: "NPS: 9" },
  { f: "Contract Type",    v: "Annual",      note: "3-year commitment" },
  { f: "Company Size",     v: "Enterprise",  note: "1,200+ employees" },
  { f: "Industry",         v: "Software/SaaS",note: "High CLV category" },
];

const recs = [
  { action: "Expand Analytics Module",     impact: "+₹1.2L/mo MRR",   effort: "Medium", color: "#5b5ff1" },
  { action: "Propose 3-Year Renewal",      impact: "+18% CLV",         effort: "Low",    color: "#10b981" },
  { action: "Enable AI Feature Suite",     impact: "+₹65K/mo",         effort: "Low",    color: "#7c3aed" },
  { action: "Schedule Executive QBR",      impact: "Risk −40%",        effort: "Low",    color: "#3b82f6" },
];

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 13px", fontSize: 12, boxShadow: "var(--shadow-md)" }}>
      <div style={{ fontWeight: 700, marginBottom: 5 }}>{label}</div>
      {payload.map((p: any, i: number) => p.value !== null && (
        <div key={i} style={{ color: p.color, display: "flex", gap: 10, justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted-foreground)" }}>{p.name}</span>
          <span style={{ fontWeight: 700 }}>₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
};

export default function CLVIntelligence() {
  const [horizon, setHorizon]   = useState("12 Months");
  const [customer, setCustomer] = useState("C1001 — Acme Technologies");
  const [modal, setModal]       = useState<string | null>(null);
  const { toast } = useToast();

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Customer Lifetime Value (CLV)</h1>
          <p className="page-subtitle">Core data-science workspace — predict and explain customer lifetime value</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={customer} onChange={e => setCustomer(e.target.value)} className="input" style={{ width: 240, fontSize: 13 }}>
            <option>C1001 — Acme Technologies</option>
            <option>C1009 — Vertex Finance</option>
            <option>C1004 — TechNova Corp</option>
            <option>C1007 — Cascade Health</option>
          </select>
          <div style={{ display: "flex", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {HORIZONS.map(h => (
              <button key={h} onClick={() => setHorizon(h)} style={{
                padding: "7px 13px", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500,
                background: horizon === h ? "var(--primary)" : "transparent",
                color: horizon === h ? "white" : "var(--muted-foreground)", transition: "all 0.15s",
              }}>{h}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary prediction hero */}
      <div style={{
        background: "linear-gradient(135deg, #4d52e8 0%, #6d28d9 55%, #7c3aed 100%)",
        borderRadius: 14, padding: "28px 32px", marginBottom: 18, color: "white",
        boxShadow: "0 12px 40px rgba(91,95,241,0.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "35%", width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", position: "relative" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.65, marginBottom: 8 }}>
              Predicted CLV · {horizon}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 54, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8 }}>
              ₹7,85,000
            </div>
            <div style={{ fontSize: 14, opacity: 0.78, marginBottom: 20 }}>
              Prediction range: <strong>₹6,90,000 — ₹8,60,000</strong> · Confidence: <strong>92%</strong>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { l: "Current Value",    v: "₹6,20,000" },
                { l: "CLV Growth",       v: "+26.6%"    },
                { l: "Expected Revenue", v: "₹2.94L/yr" },
                { l: "Confidence",       v: "92%"       },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 6 }}>Trajectory preview</div>
            <ResponsiveContainer width={200} height={80}>
              <AreaChart data={trajectory}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="white" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="clv" stroke="white" fill="url(#wg)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, padding: "5px 11px", background: "rgba(255,255,255,0.14)", borderRadius: 8, fontSize: 11.5, fontWeight: 600 }}>
              Acme Technologies · C1001
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Trajectory chart */}
        <div className="chart-card">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>CLV Trajectory</div>
            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>Historical · current · forecast with confidence interval</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trajectory} margin={{ left: -10, right: 4 }}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b5ff1" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#5b5ff1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={v => "₹" + v + "L"} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="high"  stroke="none" fill="rgba(91,95,241,0.1)" name="Upper" />
              <Area type="monotone" dataKey="low"   stroke="none" fill="white"                name="Lower" />
              <Area type="monotone" dataKey="clv"   stroke="#5b5ff1" fill="url(#tg)" strokeWidth={2.5} dot={{ fill: "#5b5ff1", r: 3 }} name="CLV" />
              <ReferenceLine x="Sep '24" stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Now", fill: "#f59e0b", fontSize: 10, position: "top" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Model inputs */}
        <div className="chart-card">
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>Model Input Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {modelInputs.map(({ f, v, note }) => (
              <div key={f} style={{ padding: "9px 11px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginBottom: 2 }}>{f}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 1 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* SHAP */}
        <div className="chart-card">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>What drives this CLV?</div>
            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>Local SHAP values — positive and negative contributors</div>
          </div>
          {shapData.map(s => (
            <div key={s.feature} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{s.feature}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.direction === "positive" ? "#5b5ff1" : "#ef4444" }}>
                  {s.direction === "positive" ? "+" : "−"}{(Math.abs(s.value) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="shap-track">
                {s.direction === "positive"
                  ? <div className="shap-pos" style={{ width: `${Math.abs(s.value) * 100}%` }} />
                  : <div className="shap-neg" style={{ width: `${Math.abs(s.value) * 100}%` }} />
                }
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: "11px 13px", background: "rgba(91,95,241,0.06)", borderRadius: 9, border: "1px solid rgba(91,95,241,0.18)", fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--foreground)" }}>Insight:</strong> Monthly spend and product adoption are the strongest value drivers. Reducing support tickets could add an estimated <strong>₹45,000</strong> to CLV.
          </div>
        </div>

        {/* How to increase */}
        <div className="chart-card">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>How can we increase CLV?</div>
            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>AI-recommended actions ranked by predicted impact</div>
          </div>
          {recs.map((r, i) => (
            <div key={r.action} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: 10, border: "1px solid var(--border)", background: "var(--muted)",
              marginBottom: 10, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = r.color + "0d"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--muted)"; }}
              onClick={() => setModal(r.action)}
            >
              <div style={{ width: 28, height: 28, borderRadius: 7, background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: r.color }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.action}</div>
                <div style={{ fontSize: 11.5, color: r.color, fontWeight: 600, marginTop: 1 }}>Impact: {r.impact}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span className={`badge ${r.effort === "Low" ? "badge-success" : "badge-warning"}`}>{r.effort} effort</span>
                <ArrowRight size={11} color="var(--muted-foreground)" />
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => toast("Full AI playbook generated", "success")}>
            <Zap size={14} /> Generate Full AI Playbook
          </button>
        </div>
      </div>

      {modal && (
        <Modal title={modal} onClose={() => setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { setModal(null); toast("Action queued successfully", "success"); }}>Confirm Action</button></>}
        >
          <p style={{ fontSize: 13.5, color: "var(--muted-foreground)", lineHeight: 1.65, margin: 0 }}>
            AI-generated recommendation for <strong>Acme Technologies</strong>:<br /><br />
            Based on current CLV trajectory and usage data, this action has a <strong>72% predicted success probability</strong> in improving the 12-month CLV by the stated amount. The model recommends executing within 14 days for maximum impact.
          </p>
        </Modal>
      )}
    </div>
  );
}
