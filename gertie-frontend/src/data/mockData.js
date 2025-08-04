// ====================================================================================
// MOCK DATA (Simulating responses from your FastAPI backend)
// ====================================================================================

export const portfolioOverview = {
  totalValue: 52800.75,
  oneDayReturn: -0.004,
  overallReturn: 0.085,
};

export const riskMetrics = {
  overallRiskScore: 3.2,
  valueAtRisk: 25400.0,
};

export const riskLevelData = [
  { name: "Jan", level: 2.1 },
  { name: "Feb", level: 2.3 },
  { name: "Mar", level: 2.0 },
  { name: "Apr", level: 2.5 },
  { name: "May", level: 2.8 },
  { name: "Jun", level: 3.2 },
];

export const riskAssessmentData = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  level: Math.floor(Math.random() * 4),
}));

export const portfolioPerformanceData = [
  { name: "Jan", performance: 4000 },
  { name: "Feb", performance: 3000 },
  { name: "Mar", performance: 5000 },
  { name: "Apr", performance: 4500 },
  { name: "May", performance: 6000 },
  { name: "Jun", performance: 5800 },
];

export const alertsData = [
  { name: "Jan", alerts: 2 },
  { name: "Feb", alerts: 1 },
  { name: "Mar", alerts: 3 },
  { name: "Apr", alerts: 2 },
  { name: "May", alerts: 5 },
  { name: "Jun", alerts: 4 },
];

export const holdingsData = [
  {
    name: "AAPL",
    value: 3000,
    risk: 1.65,
    allocation: 0.061,
    category: "Tech",
  },
  { name: "SPY", value: 14000, risk: 0.82, allocation: 0.28, category: "ETF" },
  {
    name: "JNJ",
    value: 8500,
    risk: 1.25,
    allocation: 0.17,
    category: "Healthcare",
  },
  { name: "TLT", value: 7000, risk: 0.95, allocation: 0.14, category: "Bonds" },
  { name: "QQQ", value: 10000, risk: 1.1, allocation: 0.2, category: "ETF" },
  { name: "AGG", value: 5000, risk: 0.45, allocation: 0.1, category: "Bonds" },
];

export const highAlert = {
  title: "High risk detected",
  description: "Portfolio volatility exceeded threshold",
  time: "2 hours ago",
};

// --- Analytics Page Data ---
export const allocationByCategoryData = [
  { name: "ETFs", value: 24000 },
  { name: "Bonds", value: 12000 },
  { name: "Healthcare", value: 8500 },
  { name: "Tech", value: 3000 },
  { name: "Cash", value: 5300 },
];

export const optimizationSuggestions = {
  current_allocation: { AAPL: 0.3, SPY: 0.25, QQQ: 0.25, CASH: 0.2 },
  suggested_allocation: { AAPL: 0.28, SPY: 0.22, QQQ: 0.27, CASH: 0.23 },
  rationale:
    "Increase cash allocation due to elevated market volatility and detected mean-reverting signals in tech.",
  expected_improvement: {
    risk_reduction: 0.02,
    expected_return_change: -0.001,
  },
};

export const garchForecastData = [
  ...Array.from({ length: 30 }, (_, i) => ({
    day: `D-${30 - i}`,
    type: "In-Sample",
    vol: 0.015 + Math.random() * 0.01,
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    day: `D+${i + 1}`,
    type: "Forecast",
    vol: 0.022 + Math.random() * 0.005,
  })),
];

export const hurstData = {
  hurst_exponent: 0.42,
  interpretation: "mean-reverting",
};

export const regimeData = {
  current_regime: "Low Volatility",
  transition_matrix: [
    [0.95, 0.04, 0.01],
    [0.2, 0.75, 0.05],
    [0.1, 0.3, 0.6],
  ],
  regimes: ["Low Vol", "Mid Vol", "High Vol"],
};

// --- Alerts Page Data ---
export const alertsList = [
  {
    id: 1,
    type: "high",
    title: "High Volatility Alert",
    description: "Portfolio volatility exceeded 95th percentile",
    time: "2 hours ago",
    severity: "critical",
  },
  {
    id: 2,
    type: "medium",
    title: "Rebalancing Suggested",
    description: "Tech allocation is 5% above target",
    time: "1 day ago",
    severity: "warning",
  },
  {
    id: 3,
    type: "low",
    title: "Performance Update",
    description: "Monthly returns report available",
    time: "3 days ago",
    severity: "info",
  },
];

export const CHART_COLORS = [
  "#3b82f6",
  "#facc15",
  "#10b981",
  "#f97316",
  "#8b5cf6",
];
