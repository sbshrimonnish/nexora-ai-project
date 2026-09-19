import { useState, useEffect } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { ToastProvider } from "./components/ui/Toast";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import CommandPalette from "./components/CommandPalette";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CLVIntelligence from "./pages/CLVIntelligence";
import CustomerDirectory from "./pages/CustomerDirectory";
import CLVSegmentation from "./pages/CLVSegmentation";
import RevenueForecast from "./pages/RevenueForecast";
import CohortAnalytics from "./pages/CohortAnalytics";
import ChurnIntelligence from "./pages/ChurnIntelligence";
import XAIModel from "./pages/XAIModel";
import DatasetIngestion from "./pages/DatasetIngestion";
import ModelRetraining from "./pages/ModelRetraining";
import AcademicReview from "./pages/AcademicReview";
import CopilotPage, { CopilotFloating } from "./pages/Copilot";
import Settings from "./pages/Settings";
import IndividualProgress from "./pages/IndividualProgress";

export default function App() {
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [page,      setPage]      = useState("dashboard");
  const [isDark,    setIsDark]    = useState(false);
  const [currency,  setCurrency]  = useState("INR");
  const [cmdOpen,   setCmdOpen]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);

  /* Ctrl/Cmd + K */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* Dark mode sync */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.body.style.background = isDark ? "#08090e" : "#f4f5fa";
  }, [isDark]);

  /* Page title sync */
  useEffect(() => {
    const titleMap: Record<string, string> = {
      "dashboard":           "Executive Dashboard",
      "clv-intelligence":    "Customer Lifetime Value (CLV)",
      "customer-directory":  "Customer Directory",
      "individual-progress": "Individual Progress",
      "clv-segmentation":    "CLV Segmentation",
      "revenue-forecast":    "Revenue Forecast",
      "cohort-analytics":    "Cohort Analytics",
      "churn-intelligence":  "Churn Intelligence",
      "xai-model":           "XAI Model Evaluation",
      "dataset-ingestion":   "Dataset Ingestion",
      "model-retraining":    "Model Retraining",
      "academic-review":     "Academic Review",
      "copilot":             "AI Copilot",
      "settings":            "Settings",
    };
    const subtitle = titleMap[page] || "Customer Lifetime Value";
    document.title = `Nexora AI — ${subtitle}`;
  }, [page]);

  const navigate = (p: string) => {
    setPage(p);
    setMobileOpen(false);
  };
  const toggleTheme = () => setIsDark(d => !d);

  if (!loggedIn) {
    return (
      <ToastProvider>
        <LoginPage onLogin={() => setLoggedIn(true)} />
      </ToastProvider>
    );
  }

  const handleSelectCustomer = (customer?: any) => {
    if (customer?.id) {
      setSelectedCustomerId(String(customer.id));
    }
    navigate("individual-progress");
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":            return <Dashboard />;
      case "clv-intelligence":     return <CLVIntelligence />;
      case "customer-directory":   return (
        <CustomerDirectory
          onSelectCustomer={handleSelectCustomer}
        />
      );
      case "individual-progress":  return (
        <IndividualProgress
          customerId={selectedCustomerId}
          onBack={() => navigate("customer-directory")}
        />
      );
      case "clv-segmentation":     return <CLVSegmentation />;
      case "revenue-forecast":     return <RevenueForecast />;
      case "cohort-analytics":     return <CohortAnalytics />;
      case "churn-intelligence":   return <ChurnIntelligence />;
      case "xai-model":            return <XAIModel />;
      case "dataset-ingestion":    return <DatasetIngestion />;
      case "model-retraining":     return <ModelRetraining />;
      case "academic-review":      return <AcademicReview />;
      case "copilot":              return <CopilotPage />;
      case "settings":             return <Settings isDark={isDark} onToggleTheme={toggleTheme} currency={currency} onCurrencyChange={setCurrency} />;
      default:                     return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
        <Sidebar
          activePage={page}
          onNavigate={navigate}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <Header
            activePage={page}
            onOpenCommand={() => setCmdOpen(true)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            currency={currency}
            onCurrencyChange={setCurrency}
            onToggleMobileMenu={() => setMobileOpen(m => !m)}
          />
          <main style={{ flex: 1, overflowY: "auto", background: "var(--background)" }}>
            {renderPage()}
          </main>
        </div>

        {/* Sidebar collapse toggle (hidden on mobile) */}
        <button
          className="hide-mobile"
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: "fixed", bottom: 88, left: collapsed ? 66 : 230,
            zIndex: 300, width: 26, height: 26, borderRadius: "50%",
            background: "var(--card)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "left 0.2s ease",
            boxShadow: "var(--shadow-sm)", color: "var(--muted-foreground)",
          }}
        >
          {collapsed ? <PanelLeft size={11} /> : <PanelLeftClose size={11} />}
        </button>

        {/* Floating Copilot — hidden when on copilot page */}
        {page !== "copilot" && <CopilotFloating />}

        {/* Command palette */}
        {cmdOpen && (
          <CommandPalette
            onClose={() => setCmdOpen(false)}
            onNavigate={navigate}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>
    </ToastProvider>
  );
}

