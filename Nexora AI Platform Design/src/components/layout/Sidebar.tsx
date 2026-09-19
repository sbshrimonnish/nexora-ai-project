import {
  LayoutDashboard, BrainCircuit, Users, UserCircle, PieChart, TrendingUp,
  BarChart2, AlertTriangle, FlaskConical, Database, RefreshCw, GraduationCap,
  Bot, Settings, LogOut, Moon, Sun, Cpu, ChevronRight, Activity
} from "lucide-react";

const iconMap: Record<string, any> = {
  LayoutDashboard, BrainCircuit, Users, UserCircle, PieChart, TrendingUp,
  BarChart2, AlertTriangle, FlaskConical, Database, RefreshCw, GraduationCap,
  Bot, Settings, Activity,
};

interface NavItem {
  id: string;
  label: string;
  icon: string;
  primary?: boolean;
  secondary?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Core Intelligence",
    items: [
      { id: "dashboard",        label: "Executive Dashboard",            icon: "LayoutDashboard", primary: true },
      { id: "clv-intelligence", label: "Customer Lifetime Value (CLV)", icon: "BrainCircuit",   primary: true },
    ],
  },
  {
    label: "Customers",
    items: [
      { id: "customer-directory",   label: "Customer Directory",    icon: "Users"       },
      { id: "customer-360",         label: "Customer 360°",         icon: "UserCircle"  },
      { id: "individual-progress",  label: "Individual Progress",   icon: "Activity"    },
      { id: "clv-segmentation",     label: "CLV Segmentation",      icon: "PieChart"    },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "revenue-forecast",  label: "Revenue Forecast",  icon: "TrendingUp" },
      { id: "cohort-analytics",  label: "Cohort Analytics",  icon: "BarChart2"  },
      { id: "churn-intelligence",label: "Churn Intelligence",icon: "AlertTriangle", secondary: true },
    ],
  },
  {
    label: "Model & Data",
    items: [
      { id: "xai-model",          label: "XAI / Model Eval",  icon: "FlaskConical" },
      { id: "dataset-ingestion",  label: "Dataset Ingestion", icon: "Database"     },
      { id: "model-retraining",   label: "Model Retraining",  icon: "RefreshCw"    },
    ],
  },
  {
    label: "Other",
    items: [
      { id: "academic-review", label: "Academic Review", icon: "GraduationCap" },
      { id: "copilot",         label: "AI Copilot",      icon: "Bot"           },
      { id: "settings",        label: "Settings",        icon: "Settings"      },
    ],
  },
];

interface Props {
  activePage: string;
  onNavigate: (p: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ activePage, onNavigate, isDark, onToggleTheme, collapsed, mobileOpen, onCloseMobile }: Props) {
  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={onCloseMobile} />
      )}

      <aside
        className={mobileOpen ? "sidebar-aside mobile-open" : "sidebar-aside"}
        style={{
          width: collapsed && !mobileOpen ? 56 : 220,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.2s ease",
          flexShrink: 0,
          position: mobileOpen ? "fixed" : "sticky",
          top: 0,
          left: mobileOpen ? 0 : undefined,
          zIndex: mobileOpen ? 1000 : 20,
          boxShadow: mobileOpen ? "var(--shadow-xl)" : "none",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{ padding: collapsed && !mobileOpen ? "14px 0" : "14px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--sidebar-border)", justifyContent: collapsed && !mobileOpen ? "center" : "flex-start", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #5b5ff1 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Cpu size={15} color="white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 14.5, color: "var(--sidebar-fg)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Nexora AI</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5b5ff1" }}>Customer Lifetime Value</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: collapsed && !mobileOpen ? "8px 4px" : "8px 8px" }}>
          {sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              {(!collapsed || mobileOpen) && (
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sidebar-muted)", padding: "10px 10px 4px", overflow: "hidden", whiteSpace: "nowrap", opacity: 0.85 }}>
                  {sec.label}
                </div>
              )}
              {collapsed && !mobileOpen && si > 0 && <div style={{ height: 1, background: "var(--sidebar-border)", margin: "6px 4px" }} />}
              {sec.items.map(item => {
                const Icon = iconMap[item.icon];
                const isActive = activePage === item.id;
                return (
                  <div
                    key={item.id}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => handleItemClick(item.id)}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                    style={{
                      justify: collapsed && !mobileOpen ? "center" : "flex-start",
                      padding: collapsed && !mobileOpen ? "8px 6px" : "7px 10px",
                      opacity: item.secondary && !isActive ? 0.7 : 1,
                      marginBottom: 1,
                    }}
                  >
                    {Icon && (
                      <span className="sidebar-icon" style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75, display: "flex" }}>
                        <Icon size={15} strokeWidth={2} />
                      </span>
                    )}
                    {(!collapsed || mobileOpen) && (
                      <>
                        <span style={{ flex: 1, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                        {item.primary && !isActive && (
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#5b5ff1", opacity: 0.5, flexShrink: 0 }} />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--sidebar-border)", padding: collapsed && !mobileOpen ? "8px 4px" : "8px 8px", flexShrink: 0 }}>
          <div
            className="sidebar-item"
            onClick={onToggleTheme}
            style={{ justifyContent: collapsed && !mobileOpen ? "center" : "flex-start", padding: collapsed && !mobileOpen ? "8px 6px" : "7px 10px" }}
            title={collapsed && !mobileOpen ? (isDark ? "Light mode" : "Dark mode") : undefined}
          >
            {isDark ? <Sun size={15} strokeWidth={2} style={{ flexShrink: 0 }} /> : <Moon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />}
            {(!collapsed || mobileOpen) && <span style={{ fontSize: 12.5 }}>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </div>

          {(!collapsed || mobileOpen) && (() => {
            const googleName = localStorage.getItem("nexora_google_name");
            const name = googleName || "Shri Monnish";
            const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 10px 4px", cursor: "pointer" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>{initials}</div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sidebar-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--sidebar-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Analytics Lead</div>
                </div>
                <LogOut size={12} color="var(--sidebar-muted)" />
              </div>
            );
          })()}
        </div>
      </aside>
    </>
  );
}
