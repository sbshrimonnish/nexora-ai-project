export const fmt = (n: number, currency = "INR") => {
  if (currency === "INR")
    return "₹" + (n >= 100000 ? (n / 100000).toFixed(2) + "L" : n >= 1000 ? (n / 1000).toFixed(0) + "K" : n.toFixed(0));
  if (currency === "USD") return "$" + (n / 83).toFixed(0);
  if (currency === "EUR") return "€" + (n / 90).toFixed(0);
  if (currency === "GBP") return "£" + (n / 104).toFixed(0);
  return "₹" + n;
};

export const formatFull = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

export const customers = [
  { id: "C1001", company: "Acme Technologies", industry: "Software", size: "Enterprise", mrr: 245000, clv: 7850000, clvGrowth: 18.4, health: 87, churnRisk: 12, tenure: 38, segment: "High Value", status: "Active", lastActivity: "2 hrs ago" },
  { id: "C1002", company: "Stellar Dynamics", industry: "Finance", size: "Mid-Market", mrr: 189000, clv: 5620000, clvGrowth: 24.1, health: 91, churnRisk: 8, tenure: 52, segment: "High Value", status: "Active", lastActivity: "1 day ago" },
  { id: "C1003", company: "NovaSpark Labs", industry: "Healthcare", size: "SMB", mrr: 67000, clv: 1240000, clvGrowth: 6.2, health: 63, churnRisk: 34, tenure: 14, segment: "Growth Opportunity", status: "At Risk", lastActivity: "3 days ago" },
  { id: "C1004", company: "TechNova Corp", industry: "E-commerce", size: "Enterprise", mrr: 312000, clv: 9100000, clvGrowth: 31.2, health: 94, churnRisk: 5, tenure: 61, segment: "High Value", status: "Active", lastActivity: "30 mins ago" },
  { id: "C1005", company: "Orbit Systems", industry: "Logistics", size: "Mid-Market", mrr: 145000, clv: 3780000, clvGrowth: -4.5, health: 58, churnRisk: 48, tenure: 29, segment: "Declining Value", status: "At Risk", lastActivity: "5 days ago" },
  { id: "C1006", company: "Prism Analytics", industry: "Software", size: "SMB", mrr: 43000, clv: 890000, clvGrowth: 15.7, health: 78, churnRisk: 18, tenure: 22, segment: "Developing", status: "Active", lastActivity: "1 day ago" },
  { id: "C1007", company: "Cascade Health", industry: "Healthcare", size: "Enterprise", mrr: 278000, clv: 8240000, clvGrowth: 12.8, health: 89, churnRisk: 9, tenure: 47, segment: "High Value", status: "Active", lastActivity: "4 hrs ago" },
  { id: "C1008", company: "BlueWave Retail", industry: "E-commerce", size: "Mid-Market", mrr: 98000, clv: 2150000, clvGrowth: -12.3, health: 44, churnRisk: 67, tenure: 18, segment: "Declining Value", status: "Churned", lastActivity: "12 days ago" },
  { id: "C1009", company: "Vertex Finance", industry: "Finance", size: "Enterprise", mrr: 421000, clv: 11200000, clvGrowth: 22.9, health: 96, churnRisk: 4, tenure: 73, segment: "High Value", status: "Active", lastActivity: "1 hr ago" },
  { id: "C1010", company: "CloudPath SaaS", industry: "Software", size: "SMB", mrr: 52000, clv: 1050000, clvGrowth: 8.4, health: 72, churnRisk: 22, tenure: 16, segment: "Stable Value", status: "Active", lastActivity: "2 days ago" },
  { id: "C1011", company: "Meridian Pharma", industry: "Healthcare", size: "Enterprise", mrr: 198000, clv: 6300000, clvGrowth: 19.1, health: 85, churnRisk: 14, tenure: 44, segment: "High Value", status: "Active", lastActivity: "6 hrs ago" },
  { id: "C1012", company: "SwiftLog", industry: "Logistics", size: "SMB", mrr: 28000, clv: 560000, clvGrowth: 3.2, health: 68, churnRisk: 29, tenure: 11, segment: "Low Value", status: "Active", lastActivity: "3 days ago" },
];

export const clvTrendData = [
  { month: "Apr '24", clv: 42000000, mrr: 1850000 },
  { month: "May '24", clv: 44500000, mrr: 1920000 },
  { month: "Jun '24", clv: 46200000, mrr: 2010000 },
  { month: "Jul '24", clv: 48800000, mrr: 2080000 },
  { month: "Aug '24", clv: 51000000, mrr: 2140000 },
  { month: "Sep '24", clv: 53500000, mrr: 2210000 },
  { month: "Oct '24", clv: 56100000, mrr: 2290000 },
  { month: "Nov '24", clv: 58700000, mrr: 2360000 },
  { month: "Dec '24", clv: 61300000, mrr: 2420000 },
  { month: "Jan '25", clv: 64200000, mrr: 2500000 },
  { month: "Feb '25", clv: 67000000, mrr: 2580000 },
  { month: "Mar '25", clv: 70400000, mrr: 2650000 },
];

export const forecastData = [
  { month: "Apr '25", actual: 70400000, predicted: 73200000, low: 67000000, high: 79000000 },
  { month: "May '25", actual: null, predicted: 76500000, low: 69500000, high: 83500000 },
  { month: "Jun '25", actual: null, predicted: 80100000, low: 72000000, high: 88200000 },
  { month: "Jul '25", actual: null, predicted: 83800000, low: 74500000, high: 93100000 },
  { month: "Aug '25", actual: null, predicted: 87600000, low: 77200000, high: 98000000 },
  { month: "Sep '25", actual: null, predicted: 91500000, low: 80000000, high: 103000000 },
];

export const segmentData = [
  { name: "High Value", customers: 12500, totalClv: 98400000000, avgClv: 7872000, revenue: 48.2, tenure: 52, color: "#6366f1" },
  { name: "Growth Opportunity", customers: 15200, totalClv: 54200000000, avgClv: 3565000, revenue: 26.5, tenure: 24, color: "#8b5cf6" },
  { name: "Stable Value", customers: 11800, totalClv: 24800000000, avgClv: 2101000, revenue: 14.2, tenure: 38, color: "#3b82f6" },
  { name: "Developing", customers: 5400, totalClv: 6200000000, avgClv: 1148000, revenue: 6.1, tenure: 12, color: "#10b981" },
  { name: "Declining Value", customers: 3600, totalClv: 3500000000, avgClv: 972000, revenue: 3.5, tenure: 31, color: "#f59e0b" },
  { name: "Low Value", customers: 1500, totalClv: 1500000000, avgClv: 1000000, revenue: 1.5, tenure: 8, color: "#6b7280" },
];

export const shapData = [
  { feature: "Monthly Spend", value: 0.38, direction: "positive" },
  { feature: "Product Adoption", value: 0.28, direction: "positive" },
  { feature: "Usage Frequency", value: 0.22, direction: "positive" },
  { feature: "Tenure", value: 0.18, direction: "positive" },
  { feature: "Revenue Trend", value: 0.15, direction: "positive" },
  { feature: "Contract Length", value: 0.12, direction: "positive" },
  { feature: "Support Tickets", value: -0.09, direction: "negative" },
  { feature: "Churn Risk", value: -0.14, direction: "negative" },
  { feature: "Payment Delays", value: -0.07, direction: "negative" },
];

export const cohortData = [
  { cohort: "Q1 2023", customers: 245, initialClv: 1850000, currentClv: 3420000, clvRetention: 94, revenueRetention: 97, customerRetention: 89 },
  { cohort: "Q2 2023", customers: 312, initialClv: 1620000, currentClv: 2810000, clvRetention: 91, revenueRetention: 93, customerRetention: 86 },
  { cohort: "Q3 2023", customers: 289, initialClv: 1940000, currentClv: 3050000, clvRetention: 89, revenueRetention: 91, customerRetention: 84 },
  { cohort: "Q4 2023", customers: 401, initialClv: 1720000, currentClv: 2580000, clvRetention: 87, revenueRetention: 89, customerRetention: 82 },
  { cohort: "Q1 2024", customers: 378, initialClv: 2100000, currentClv: 2840000, clvRetention: 85, revenueRetention: 87, customerRetention: 80 },
  { cohort: "Q2 2024", customers: 445, initialClv: 1980000, currentClv: 2410000, clvRetention: 82, revenueRetention: 84, customerRetention: 78 },
];

export const mrrHistoryData = [
  { month: "Apr", mrr: 1850000, arr: 22200000 },
  { month: "May", mrr: 1920000, arr: 23040000 },
  { month: "Jun", mrr: 2010000, arr: 24120000 },
  { month: "Jul", mrr: 2080000, arr: 24960000 },
  { month: "Aug", mrr: 2140000, arr: 25680000 },
  { month: "Sep", mrr: 2210000, arr: 26520000 },
  { month: "Oct", mrr: 2290000, arr: 27480000 },
  { month: "Nov", mrr: 2360000, arr: 28320000 },
  { month: "Dec", mrr: 2420000, arr: 29040000 },
  { month: "Jan", mrr: 2500000, arr: 30000000 },
  { month: "Feb", mrr: 2580000, arr: 30960000 },
  { month: "Mar", mrr: 2650000, arr: 31800000 },
];

export const acmeTimeline = [
  { date: "Mar 2022", event: "Onboarding Complete", type: "success", detail: "All 3 product modules activated" },
  { date: "Jun 2022", event: "First Upgrade", type: "upgrade", detail: "Moved from Starter to Pro plan — ₹1.2L/mo" },
  { date: "Sep 2022", event: "Support Issue", type: "warning", detail: "API integration resolved in 2 days" },
  { date: "Jan 2023", event: "Contract Renewal", type: "success", detail: "Annual renewal — 18% YoY growth" },
  { date: "Apr 2023", event: "Expansion", type: "upgrade", detail: "Added Analytics Module — ₹45K/mo" },
  { date: "Jul 2023", event: "Payment Delay", type: "warning", detail: "Invoice delayed 12 days — resolved" },
  { date: "Oct 2023", event: "Renewal Negotiation", type: "info", detail: "3-year contract locked — discounted" },
  { date: "Feb 2024", event: "Product Adoption Peak", type: "success", detail: "92% feature utilization achieved" },
  { date: "Mar 2025", event: "Risk Signal", type: "danger", detail: "Usage dipped 18% — intervention needed" },
];

export const copilotMessages = [
  {
    role: "ai",
    content: "Hello! I'm Nexora Copilot. I can help you analyze CLV predictions, identify high-value customers, explain model decisions, and generate retention strategies. How can I assist you today?",
    time: "Just now",
  }
];

export const navItems = [
  { id: "dashboard", label: "Executive Dashboard", icon: "LayoutDashboard", primary: true },
  { id: "clv-intelligence", label: "Customer Lifetime Value (CLV)", icon: "BrainCircuit", primary: true },
  { id: "customer-directory", label: "Customer Directory", icon: "Users" },
  { id: "clv-segmentation", label: "CLV Segmentation", icon: "PieChart" },
  { id: "revenue-forecast", label: "Revenue Forecast", icon: "TrendingUp" },
  { id: "cohort-analytics", label: "Cohort Analytics", icon: "BarChart2" },
  { id: "churn-intelligence", label: "Churn Intelligence", icon: "AlertTriangle", secondary: true },
  { id: "xai-model", label: "XAI / Model Evaluation", icon: "FlaskConical" },
  { id: "dataset-ingestion", label: "Dataset Ingestion", icon: "Database" },
  { id: "model-retraining", label: "Model Retraining", icon: "RefreshCw" },
  { id: "copilot", label: "AI Copilot", icon: "Bot" },
  { id: "settings", label: "Settings", icon: "Settings" },
];
