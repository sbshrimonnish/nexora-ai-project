import { useState } from "react";
import {
  Search, LayoutDashboard, BrainCircuit, Users, UserCircle, TrendingUp,
  BarChart2, AlertTriangle, FlaskConical, GraduationCap, Bot, LogOut,
  Moon, Download, Database, RefreshCw, PieChart, Settings, ArrowRight
} from "lucide-react";

const commands = [
  { id: "dashboard",           label: "Executive Dashboard",         icon: LayoutDashboard, cat: "Navigate" },
  { id: "clv-intelligence",    label: "Customer Lifetime Value (CLV)", icon: BrainCircuit,    cat: "Navigate" },
  { id: "customer-directory",  label: "Customer Directory",          icon: Users,           cat: "Navigate" },
  { id: "clv-segmentation",    label: "CLV Segmentation",            icon: PieChart,        cat: "Navigate" },
  { id: "revenue-forecast",    label: "Revenue Forecast",            icon: TrendingUp,      cat: "Navigate" },
  { id: "cohort-analytics",    label: "Cohort Analytics",            icon: BarChart2,       cat: "Navigate" },
  { id: "churn-intelligence",  label: "Churn Intelligence",          icon: AlertTriangle,   cat: "Navigate" },
  { id: "xai-model",           label: "XAI / Model Evaluation",      icon: FlaskConical,    cat: "Navigate" },
  { id: "dataset-ingestion",   label: "Dataset Ingestion",           icon: Database,        cat: "Navigate" },
  { id: "model-retraining",    label: "Model Retraining",            icon: RefreshCw,       cat: "Navigate" },
  { id: "copilot",             label: "Open AI Copilot",             icon: Bot,             cat: "Navigate" },
  { id: "settings",            label: "Settings",                    icon: Settings,        cat: "Navigate" },
  { id: "theme",               label: "Toggle Dark / Light Mode",    icon: Moon,            cat: "Actions"  },
  { id: "export",              label: "Export Customer CSV",         icon: Download,        cat: "Actions"  },
  { id: "logout",              label: "Sign Out",                    icon: LogOut,          cat: "Actions"  },
];

interface Props {
  onClose: () => void;
  onNavigate: (p: string) => void;
  onToggleTheme: () => void;
}

export default function CommandPalette({ onClose, onNavigate, onToggleTheme }: Props) {
  const [q, setQ] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = q
    ? commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
    : commands;

  const categories = [...new Set(filtered.map(c => c.cat))];

  const select = (id: string) => {
    if (id === "theme")  { onToggleTheme(); onClose(); return; }
    if (id === "export" || id === "logout") { onClose(); return; }
    onNavigate(id);
    onClose();
  };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        {/* Search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={15} color="var(--muted-foreground)" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search commands, pages, customers…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--foreground)", fontFamily: "inherit" }}
          />
          {q && (
            <button onClick={() => setQ("")} style={{ border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "var(--muted)" }}>
              Clear
            </button>
          )}
          <kbd style={{ fontSize: 10.5, background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 7px", fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", maxHeight: 400, padding: "6px" }}>
          {categories.map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "8px 12px 4px" }}>{cat}</div>
              {filtered.filter(c => c.cat === cat).map(cmd => {
                const Icon = cmd.icon;
                const isHov = hovered === cmd.id;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => select(cmd.id)}
                    onMouseEnter={() => setHovered(cmd.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                      borderRadius: 8, cursor: "pointer",
                      background: isHov ? "var(--muted)" : "transparent",
                      color: "var(--foreground)", fontSize: 13.5,
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: isHov ? "rgba(91,95,241,0.12)" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color={isHov ? "var(--primary)" : "var(--muted-foreground)"} />
                    </div>
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {isHov && <ArrowRight size={13} color="var(--muted-foreground)" />}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 13.5 }}>
              No results for <strong>"{q}"</strong>
            </div>
          )}
        </div>

        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 18, fontSize: 11, color: "var(--muted-foreground)" }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
