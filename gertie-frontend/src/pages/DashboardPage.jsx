import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

// --- STEP 1: Import the necessary services and hooks ---
import { useAuth } from "../contexts/AuthContext";
import { portfolioService, analysisService } from "../services/api";

// --- UI Components (self-contained for this example) ---
// In your app, you would import these from your actual component library.
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 p-6 rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);
const MetricCard = ({ title, value, subValue }) => (
  <Card>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2 text-white">{value}</p>
    <p className="text-sm text-slate-500 mt-1">{subValue}</p>
  </Card>
);
const HoldingsTable = ({ holdings }) => (
  <Card className="col-span-1 lg:col-span-2">
    <h3 className="text-slate-300 text-lg font-semibold mb-4">Holdings</h3>
    {holdings && holdings.length > 0 ? (
      <div className="text-slate-200">{holdings.length} positions loaded.</div>
    ) : (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>No holdings found. Add positions on the Portfolio page.</p>
      </div>
    )}
  </Card>
);
const PerformanceChart = () => (
  <Card>
    <h3 className="text-slate-300 text-lg font-semibold">Performance</h3>
    <div className="flex items-center justify-center h-full text-slate-400">
      <p>Performance chart coming soon.</p>
    </div>
  </Card>
);

export const DashboardPage = () => {
  // --- STEP 2: Get full auth state, including the loading status ---
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState({ portfolio: [], beta: null, var: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- STEP 3: Create a single, robust data fetching function ---
  const fetchData = useCallback(async () => {
    // This is the key: only proceed if authentication is confirmed.
    if (!isAuthenticated) {
      setIsLoading(false);
      setData({ portfolio: [], beta: null, var: null }); // Reset data on logout
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // First, get the portfolio. The rest of the calls depend on it.
      const portfolioRes = await portfolioService.getPortfolio();
      const portfolio = portfolioRes.data;

      // Gracefully handle the case of a new user with an empty portfolio.
      if (!portfolio || portfolio.length === 0) {
        setData({ portfolio: [], beta: null, var: null });
        setIsLoading(false); // Stop loading, there's nothing more to fetch.
        return;
      }

      // Only fetch analytics AFTER we confirm a portfolio exists.
      const [betaRes, cvarRes] = await Promise.all([
        analysisService.calculateBeta({ portfolio_data: portfolio }),
        analysisService.calculateCVAR({ portfolio_returns: [] }), // Backend will use context
      ]);

      setData({
        portfolio,
        beta: betaRes.data,
        var: cvarRes.data,
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load dashboard data.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]); // Dependency ensures this function is stable and only recreated when auth state changes

  // --- STEP 4: Trigger the fetch only when authentication is ready ---
  useEffect(() => {
    // This effect waits for the initial authentication check to complete.
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]); // Re-run if the auth state finishes loading or if fetchData changes

  // --- STEP 5: Render UI based on the various loading and data states ---
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 text-red-400 p-4 rounded-lg flex items-center justify-between">
          <span>Dashboard Error: {error}</span>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalValue = data.portfolio.reduce(
    (sum, pos) => sum + (pos.market_value || 0),
    0
  );
  const portfolioBeta = data.beta?.portfolio_beta;
  const valueAtRisk = data.var?.var_analysis?.var_95?.value;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Portfolio Value"
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${data.portfolio.length} positions`}
        />
        <MetricCard
          title="Overall Risk"
          value={
            !portfolioBeta
              ? "N/A"
              : portfolioBeta > 1.3
                ? "High"
                : portfolioBeta > 0.8
                  ? "Moderate"
                  : "Low"
          }
          subValue={
            portfolioBeta
              ? `Portfolio Beta: ${portfolioBeta.toFixed(2)}`
              : "N/A"
          }
        />
        <MetricCard
          title="Value at Risk (95%)"
          value={valueAtRisk ? `${valueAtRisk.toFixed(2)}%` : "N/A"}
          subValue="1-Day Loss Potential"
        />
        <MetricCard
          title="Alerts"
          value={"0 Active"}
          subValue="Last 24 hours"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HoldingsTable holdings={data.portfolio} />
        <PerformanceChart />
      </div>
    </div>
  );
};

export default DashboardPage;
