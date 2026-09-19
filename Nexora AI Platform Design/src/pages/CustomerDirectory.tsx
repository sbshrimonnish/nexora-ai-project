import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, ExternalLink } from "lucide-react";
import { customers as demoCustomers } from "../data/demoData";
import { useToast } from "../components/ui/Toast";
import { apiService, Customer } from "../services/apiService";

const SEG_COLORS: Record<string, string> = {
  "High Value":         "#5b5ff1",
  "Mid Value":          "#8b5cf6",
  "Growth Opportunity": "#8b5cf6",
  "Stable Value":       "#3b82f6",
  "Developing":         "#10b981",
  "Low Value":          "#6b7280",
  "At Risk":            "#ef4444",
};

function HealthBar({ v }: { v: number }) {
  const c = v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div className="health-bar-track" style={{ width: 52 }}>
        <div className="health-bar-fill" style={{ width: v + "%", background: c }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: c, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

const QUICK_FILTERS = [
  { id: "",                   label: "All"                  },
  { id: "High Value",         label: "High Value"           },
  { id: "Mid Value",          label: "Mid Value"            },
  { id: "Growth Opportunity", label: "Growth Opportunity"   },
  { id: "Stable Value",       label: "Stable Value"         },
  { id: "Low Value",          label: "Low Value"            },
  { id: "At Risk",            label: "At Risk"              },
];

const COMPANY_NAMES = [
  "Acme Corp", "Stellar Dynamics", "NovaSpark Labs", "TechNova Systems", "Orbit Logistics",
  "Prism Analytics", "Cascade Health", "BlueWave Retail", "Vertex Finance", "CloudPath SaaS",
  "Meridian Pharma", "SwiftLog Enterprise", "Aura Intelligence", "Quantum Data", "Apex SaaS",
  "Horizon Cloud", "Pulse Systems", "Vanguard Tech", "Echo Networks", "Titan Solutions"
];
const INDUSTRIES = ["Software", "Finance", "Healthcare", "E-commerce", "Logistics"];
const SIZES = ["Enterprise", "Mid-Market", "SMB"];

function generate50kCustomer(i: number) {
  const compName = COMPANY_NAMES[(i * 7) % COMPANY_NAMES.length];
  const company = `Account-${i} (${compName})`;
  const industry = INDUSTRIES[i % INDUSTRIES.length];
  const size = SIZES[i % SIZES.length];
  const mrr = 15000 + ((i * 41) % 380) * 1000;
  const clv = Math.round(mrr * (22 + ((i * 17) % 38)));
  const clvGrowth = Number((-15 + ((i * 13) % 48)).toFixed(1));
  const health = 40 + ((i * 23) % 58);
  const churnRisk = Math.max(3, Math.min(85, Math.round(100 - health - ((i * 5) % 15))));
  const tenure = 6 + ((i * 19) % 65);

  let segment = "Mid Value";
  if (clv > 7000000) segment = "High Value";
  else if (clv > 3500000) segment = "Growth Opportunity";
  else if (clv > 1800000) segment = "Stable Value";
  else if (clv > 800000) segment = "Developing";
  else if (clvGrowth < 0 && churnRisk > 35) segment = "Declining Value";
  else segment = "Low Value";

  const status = churnRisk > 40 ? "At Risk" : "Active";
  const lastActivity = `${(i % 12) + 1} support tkt`;

  return {
    id: String(i),
    company,
    industry,
    size,
    mrr,
    clv,
    clvGrowth,
    health,
    churnRisk,
    tenure,
    segment,
    status,
    lastActivity,
  };
}

export default function CustomerDirectory({ onSelectCustomer }: { onSelectCustomer?: (customer?: any) => void }) {
  const [search,  setSearch]  = useState("");
  const [qf,      setQf]      = useState("");
  const [sortCol, setSortCol] = useState("predicted_clv");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page,    setPage]    = useState(1);
  const [sel,     setSel]     = useState<string[]>([]);
  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(50000);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const PER = 12;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCustomers({
        page,
        page_size: PER,
        search,
        clv_segment: qf || undefined,
        sort_by: sortCol,
        sort_desc: sortDir === "desc",
      });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const totalNum = res.meta?.total || res.data?.total || (rawList.length === PER ? 50000 : rawList.length);
      const pagesNum = res.meta?.total_pages || res.data?.total_pages || Math.ceil(totalNum / PER);

      if (rawList.length > 0) {
        setItems(rawList.map((c: any) => ({
          id: c.customer_id || String(c.account_id),
          company: c.account_name || c.company || `Account-${c.account_id}`,
          industry: c.industry || "SaaS",
          size: c.tier || c.company_size || "Mid-Market",
          mrr: c.historical_mrr || c.current_mrr || 0,
          clv: c.predicted_clv || c.clv_target_12m_revenue_based || 0,
          clvGrowth: c.clv_trajectory_pct !== undefined ? c.clv_trajectory_pct : 0,
          health: c.health_score || 50,
          churnRisk: Math.round((c.churn_probability || 0) * 100),
          tenure: c.historical_tenure_months || c.tenure_months || 12,
          segment: c.clv_segment || "Mid Value",
          status: (c.churn_probability || 0) > 0.35 ? "At Risk" : "Active",
          lastActivity: `${c.support_tickets_30d || 2} support tkt`,
        })));
        setTotal(totalNum);
        setTotalPages(pagesNum);
      } else {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err) {
      // Fallback generator for full 50,000 customer dataset
      const totalCount = 50000;
      const sLower = search.toLowerCase().trim();
      const numMatch = parseInt(sLower.replace(/[^0-9]/g, ""));

      let pageItems: any[] = [];
      let calculatedTotal = totalCount;

      if (!isNaN(numMatch) && numMatch >= 1 && numMatch <= 50000) {
        pageItems = [generate50kCustomer(numMatch)];
        calculatedTotal = 1;
      } else {
        const startIdx = (page - 1) * PER + 1;
        const endIdx = Math.min(totalCount, page * PER);
        for (let idx = startIdx; idx <= endIdx; idx++) {
          const item = generate50kCustomer(idx);
          if (qf && item.segment.toLowerCase() !== qf.toLowerCase() && !(qf === "At Risk" && item.status === "At Risk")) {
            continue;
          }
          pageItems.push(item);
        }
      }

      setItems(pageItems);
      setTotal(calculatedTotal);
      setTotalPages(Math.ceil(calculatedTotal / PER));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, qf, sortCol, sortDir]);

  const toggleSort = (col: string) => { sortCol === col ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortCol(col), setSortDir("desc")); };
  const toggleSel  = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const SortIcon = ({ col }: { col: string }) =>
    sortCol !== col ? <ChevronsUpDown size={11} color="var(--muted-foreground)" /> :
    sortDir === "desc" ? <ChevronDown size={11} color="var(--primary)" /> : <ChevronUp size={11} color="var(--primary)" />;

  return (
    <div className="page-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">50,000 customers · Sorted by Predicted CLV</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {sel.length > 0 && (
            <button className="btn btn-secondary btn-sm">{sel.length} selected ▾</button>
          )}
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => toast("Refreshed", "info")}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "0 0 250px" }}>
          <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search company or ID…"
            className="input"
            style={{ paddingLeft: 30, fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {QUICK_FILTERS.map(f => (
            <button key={f.id} onClick={() => { setQf(f.id); setPage(1); }} style={{
              padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
              border: "1px solid var(--border)",
              background: qf === f.id ? "var(--primary)" : "var(--muted)",
              color: qf === f.id ? "white" : "var(--muted-foreground)",
              transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }}><Filter size={13} /> Filters</button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }}
                    onChange={e => setSel(e.target.checked ? items.map(c => c.id) : [])}
                  />
                </th>
                {[
                  { k: "customer_id", l: "Customer ID" },
                  { k: "account_name", l: "Company" },
                  { k: "industry", l: "Industry" },
                  { k: "tier", l: "Tier" },
                  { k: "historical_mrr", l: "MRR" },
                  { k: "predicted_clv", l: "Predicted CLV" },
                  { k: "clv_trajectory_pct", l: "CLV Growth" },
                  { k: "health_score", l: "Health" },
                  { k: "churn_probability", l: "Churn Risk" },
                  { k: "historical_tenure_months", l: "Tenure" },
                  { k: "clv_segment", l: "Segment" },
                  { k: "status", l: "Status" },
                  { k: "lastActivity", l: "Support Tkts" },
                ].map(({ k, l }) => (
                  <th key={k} onClick={() => toggleSort(k)} style={{ cursor: "pointer", userSelect: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{l} <SortIcon col={k} /></div>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className={sel.includes(c.id) ? "selected" : ""} style={{ cursor: "pointer" }}>
                  <td onClick={e => { e.stopPropagation(); toggleSel(c.id); }}>
                    <input type="checkbox" checked={sel.includes(c.id)} onChange={() => toggleSel(c.id)} style={{ accentColor: "var(--primary)" }} />
                  </td>
                  <td onClick={() => onSelectCustomer?.(c)}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{c.id}</span>
                  </td>
                  <td onClick={() => onSelectCustomer?.(c)}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.company}</span>
                  </td>
                  <td><span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{c.industry}</span></td>
                  <td><span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{c.size}</span></td>
                  <td><span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>₹{(c.mrr / 1000).toFixed(0)}K</span></td>
                  <td><span className="mono" style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>₹{(c.clv / 100000).toFixed(1)}L</span></td>
                  <td><span style={{ fontSize: 12.5, fontWeight: 700, color: c.clvGrowth >= 0 ? "#10b981" : "#ef4444" }}>{c.clvGrowth >= 0 ? "+" : ""}{c.clvGrowth}%</span></td>
                  <td><HealthBar v={c.health} /></td>
                  <td>
                    <span className={`badge ${c.churnRisk < 20 ? "badge-success" : c.churnRisk < 45 ? "badge-warning" : "badge-danger"}`}>
                      {c.churnRisk}%
                    </span>
                  </td>
                  <td><span className="mono" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{c.tenure}mo</span></td>
                  <td>
                    <span className="seg-pill" style={{ background: (SEG_COLORS[c.segment] || "#5b5ff1") + "18", color: SEG_COLORS[c.segment] || "#5b5ff1" }}>
                      {c.segment}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === "Active" ? "badge-success" : "badge-warning"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td><span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{c.lastActivity}</span></td>
                  <td>
                    <button onClick={() => onSelectCustomer?.(c)} className="btn btn-ghost btn-icon btn-sm"><ExternalLink size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>
            Showing {(page - 1) * PER + 1}–{Math.min(page * PER, total)} of {total.toLocaleString()} accounts
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 30, height: 28, borderRadius: 6, border: "1px solid var(--border)", fontSize: 12.5, cursor: "pointer",
                background: page === p ? "var(--primary)" : "var(--muted)",
                color: page === p ? "white" : "var(--foreground)",
                fontFamily: "inherit", fontWeight: page === p ? 700 : 400,
              }}>{p}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
