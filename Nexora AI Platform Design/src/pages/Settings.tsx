import { useState } from "react";
import { User, Building, Palette, Bell, LayoutDashboard, Database, Brain } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "org", label: "Organization", icon: Building },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "currency", label: "Currency", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "model", label: "Model Prefs", icon: Brain },
];

export default function Settings({ isDark, onToggleTheme, currency, onCurrencyChange }: any) {
  const googleName = localStorage.getItem("nexora_google_name");
  const googleEmail = localStorage.getItem("nexora_google_email");
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(googleName || "Shri Monnish");
  const [email, setEmail] = useState(googleEmail || "shrimonnish@nexora.ai");
  const [org, setOrg] = useState("Nexora Analytics Pvt. Ltd.");
  const [notifications, setNotifications] = useState({ clvAlerts: true, churnAlerts: true, modelUpdates: true, reports: false });

  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile, preferences, and platform configuration</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
        {/* Tab nav */}
        <div className="chart-card" style={{ height: "fit-content" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 500, marginBottom: 2, transition: "all 0.15s",
                background: activeTab === id ? "rgba(99,102,241,0.1)" : "transparent",
                color: activeTab === id ? "#6366f1" : "var(--muted-foreground)",
              }}
            >
              <Icon size={14} /> {label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="chart-card">
          {activeTab === "profile" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Profile Settings</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "var(--muted)", borderRadius: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "white" }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>Analytics Lead · Admin</div>
                </div>
                <button className="btn btn-secondary" style={{ marginLeft: "auto", fontSize: 12 }}>Change Avatar</button>
              </div>
              {[
                { label: "Full Name", value: name, onChange: setName },
                { label: "Email Address", value: email, onChange: setEmail },
              ].map(({ label, value, onChange }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6 }}>{label}</label>
                  <input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13.5, color: "var(--foreground)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <button className="btn btn-primary" style={{ fontSize: 13 }}>Save Changes</button>
            </div>
          )}

          {activeTab === "org" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Organization</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6 }}>Organization Name</label>
                <input value={org} onChange={e => setOrg(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13.5, color: "var(--foreground)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ padding: "14px", background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Plan: Enterprise</div>
                {[
                  { label: "Seats", value: "25 / 50 used" },
                  { label: "Data retention", value: "36 months" },
                  { label: "API rate limit", value: "10,000 req/day" },
                  { label: "Models", value: "Unlimited" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "theme" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Theme & Appearance</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                  { id: "system", label: "System" },
                ].map(t => (
                  <div
                    key={t.id}
                    onClick={() => { if (t.id === "dark" && !isDark) onToggleTheme(); if (t.id === "light" && isDark) onToggleTheme(); }}
                    style={{
                      flex: 1, padding: "16px", borderRadius: 12, border: `2px solid ${(t.id === "dark" && isDark) || (t.id === "light" && !isDark) ? "#6366f1" : "var(--border)"}`,
                      cursor: "pointer", textAlign: "center", background: "var(--muted)", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.id === "light" ? "☀️" : t.id === "dark" ? "🌙" : "💻"}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: (t.id === "dark" && isDark) || (t.id === "light" && !isDark) ? "#6366f1" : "var(--foreground)" }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "currency" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Currency Preferences</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { code: "INR", label: "Indian Rupee", symbol: "₹" },
                  { code: "USD", label: "US Dollar", symbol: "$" },
                  { code: "EUR", label: "Euro", symbol: "€" },
                  { code: "GBP", label: "British Pound", symbol: "£" },
                ].map(c => (
                  <div
                    key={c.code}
                    onClick={() => onCurrencyChange(c.code)}
                    style={{
                      padding: "16px 20px", borderRadius: 12, border: `2px solid ${currency === c.code ? "#6366f1" : "var(--border)"}`,
                      cursor: "pointer", background: currency === c.code ? "rgba(99,102,241,0.08)" : "var(--muted)",
                      minWidth: 120, transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: currency === c.code ? "#6366f1" : "var(--foreground)", marginBottom: 4 }}>{c.symbol}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: currency === c.code ? "#6366f1" : "var(--foreground)" }}>{c.code}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Notification Preferences</div>
              {[
                { key: "clvAlerts", label: "CLV Risk Alerts", desc: "Notify when high-value customer CLV declines significantly" },
                { key: "churnAlerts", label: "Churn Risk Alerts", desc: "Notify when high-CLV customer churn risk exceeds threshold" },
                { key: "modelUpdates", label: "Model Updates", desc: "Notify when CLV model is retrained or updated" },
                { key: "reports", label: "Weekly Reports", desc: "Weekly CLV intelligence digest via email" },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <div
                    onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                    style={{
                      width: 42, height: 24, borderRadius: 12, background: notifications[key as keyof typeof notifications] ? "#6366f1" : "var(--border)",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      position: "absolute", top: 3, transition: "left 0.2s",
                      left: notifications[key as keyof typeof notifications] ? 21 : 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "dashboard" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Dashboard Preferences</div>
              {[
                "KPI Cards", "CLV Trend Chart", "MRR Chart", "Segment Donut",
                "Revenue Forecast", "Executive Financial Summary", "Customer Scatter", "CLV Distribution",
              ].map(w => (
                <div key={w} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13.5 }}>{w}</span>
                  <input type="checkbox" defaultChecked style={{ accentColor: "#6366f1", width: 15, height: 15, cursor: "pointer" }} />
                </div>
              ))}
              <button className="btn btn-secondary" style={{ fontSize: 12, marginTop: 14 }}>Reset to Default Layout</button>
            </div>
          )}

          {activeTab === "model" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Model Preferences</div>
              {[
                { label: "Default Prediction Horizon", type: "select", options: ["12 Months", "24 Months", "36 Months"] },
                { label: "Default Model", type: "select", options: ["Ensemble (Recommended)", "XGBoost", "Gradient Boosting", "Random Forest"] },
                { label: "Confidence Threshold", type: "select", options: ["90%", "85%", "80%", "75%"] },
                { label: "Retraining Frequency", type: "select", options: ["Monthly", "Quarterly", "Manual only"] },
              ].map(({ label, type, options }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6 }}>{label}</label>
                  <select style={{ width: "100%", padding: "9px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13.5, color: "var(--foreground)", outline: "none" }}>
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <button className="btn btn-primary" style={{ fontSize: 13 }}>Save Model Preferences</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
