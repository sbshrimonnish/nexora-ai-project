import { Search, Bell, ChevronRight, Command, Sun, Moon, IndianRupee, DollarSign, Euro, Menu } from "lucide-react";
import { useState } from "react";

interface Props {
  activePage: string;
  onOpenCommand: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  onToggleMobileMenu?: () => void;
}

const pageLabels: Record<string, string> = {
  "dashboard":           "Executive Dashboard",
  "clv-intelligence":    "Customer Lifetime Value (CLV)",
  "customer-directory":  "Customer Directory",
  "clv-segmentation":    "CLV Segmentation",
  "revenue-forecast":    "Revenue Forecast",
  "cohort-analytics":    "Cohort Analytics",
  "churn-intelligence":  "Churn Intelligence",
  "xai-model":           "XAI / Model Evaluation",
  "dataset-ingestion":   "Dataset Ingestion",
  "model-retraining":    "Model Retraining",
  "copilot":             "Nexora Copilot",
  "settings":            "Settings",
};

const currencySymbols: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export default function Header({ activePage, onOpenCommand, isDark, onToggleTheme, currency, onCurrencyChange, onToggleMobileMenu }: Props) {
  const [showNotif, setShowNotif]     = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showUser, setShowUser]       = useState(false);

  const closeAll = () => { setShowNotif(false); setShowCurrency(false); setShowUser(false); };

  return (
    <header style={{
      height: 52,
      background: "var(--card)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      padding: "0 14px",
      gap: 10,
      position: "sticky",
      top: 0,
      zIndex: 400,
      flexShrink: 0,
    }}>
      {/* Mobile Hamburger Menu Toggle */}
      {onToggleMobileMenu && (
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-ghost btn-icon btn-sm"
          style={{ padding: 6 }}
          title="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, fontSize: 12.5, color: "var(--muted-foreground)", minWidth: 0 }}>
        <span>Nexora AI</span>
        <ChevronRight size={11} />
        <span style={{ color: "var(--foreground)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageLabels[activePage] || activePage}</span>
      </div>

      {/* Search pill */}
      <button
        onClick={onOpenCommand}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--muted)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
          color: "var(--muted-foreground)", fontSize: 12.5,
          minWidth: 210, transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <Search size={12} />
        <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 5, padding: "1px 5px", fontSize: 10.5,
          fontFamily: "'JetBrains Mono', monospace", opacity: 0.7,
        }}>
          <Command size={8} /> K
        </div>
      </button>

      {/* Currency */}
      <div style={{ position: "relative" }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, gap: 4 }}
          onClick={() => { setShowCurrency(s => !s); setShowNotif(false); setShowUser(false); }}
        >
          {currencySymbols[currency]} {currency}
        </button>
        {showCurrency && (
          <div style={{ position: "absolute", top: "110%", right: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden", minWidth: 100 }}>
            {["INR", "USD", "EUR", "GBP"].map(c => (
              <div key={c} onClick={() => { onCurrencyChange(c); setShowCurrency(false); }}
                style={{ padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", background: c === currency ? "var(--muted)" : "transparent", color: c === currency ? "var(--primary)" : "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={e => (e.currentTarget.style.background = c === currency ? "var(--muted)" : "transparent")}
              >
                <span style={{ fontSize: 15 }}>{currencySymbols[c]}</span> {c}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme */}
      <button onClick={onToggleTheme} className="btn btn-ghost btn-icon btn-sm">
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Notifications */}
      <div style={{ position: "relative" }}>
        <button className="btn btn-ghost btn-icon btn-sm" style={{ position: "relative" }}
          onClick={() => { setShowNotif(s => !s); setShowCurrency(false); setShowUser(false); }}>
          <Bell size={15} />
          <span className="notif-dot" />
        </button>
        {showNotif && (
          <div style={{ position: "absolute", top: "110%", right: 0, width: 320, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
              <span className="badge badge-danger">3 new</span>
            </div>
            {[
              { title: "High CLV Customer at Risk", desc: "Acme Technologies — churn risk rose to 34%", time: "2h ago", dot: "#ef4444" },
              { title: "CLV Model Retrained", desc: "v2.3.1 deployed — R² improved to 0.924", time: "5h ago", dot: "#10b981" },
              { title: "Revenue Forecast Updated", desc: "Q2 ARR projection revised to ₹3.84 Cr", time: "1d ago", dot: "#5b5ff1" },
            ].map((n, i) => (
              <div key={i} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--muted)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.dot, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>{n.desc}</div>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User */}
      {(() => {
        const googleName = localStorage.getItem("nexora_google_name");
        const googleEmail = localStorage.getItem("nexora_google_email");
        const userName = googleName || "Shri Monnish";
        const userEmail = googleEmail || "shrimonnish@nexora.ai";
        const initials = userName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
        return (
          <div style={{ position: "relative" }}>
            <div
              style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", cursor: "pointer" }}
              onClick={() => { setShowUser(s => !s); setShowNotif(false); setShowCurrency(false); }}
            >{initials}</div>
            {showUser && (
              <div style={{ position: "absolute", top: "110%", right: 0, width: 200, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{userName}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
                </div>
                {[
                  { label: "Profile & Settings", page: "settings" },
                  { label: "Sign Out", page: "" },
                ].map(({ label }) => (
                  <div key={label} onClick={() => { closeAll(); }}
                    style={{ padding: "9px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--muted)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >{label}</div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </header>
  );
}
