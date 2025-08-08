import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

// --- STEP 1: Import the necessary services and hooks ---
import { useAuth } from "../contexts/AuthContext";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { analysisService } from "../services/api";
import PortfolioAllocationChart from "../components/charts/PortfolioAllocationChart";

// --- UI Components (self-contained for this example) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 p-6 rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="bg-red-900/30 text-red-400 p-4 rounded-lg flex items-center justify-between">
    <span>Analytics Error: {error}</span>
    <button
      onClick={onRetry}
      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

// Summary metrics component
const PortfolioSummary = ({ portfolioData }) => {
  const totalValue = portfolioData.reduce(
    (sum, pos) => sum + (pos.market_value || 0),
    0
  );
  const totalCost = portfolioData.reduce(
    (sum, pos) =>
      sum + (pos.weighted_average_cost || 0) * (pos.total_quantity || 0),
    0
  );
  const totalGainLoss = portfolioData.reduce(
    (sum, pos) => sum + (pos.unrealized_pnl || 0),
    0
  );
  const totalGainLossPercent =
    totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="text-center">
        <h3 className="text-slate-400 text-sm">Portfolio Value</h3>
        <p className="text-2xl font-bold text-white">
          ${totalValue.toLocaleString()}
        </p>
      </Card>
      <Card className="text-center">
        <h3 className="text-slate-400 text-sm">Total Positions</h3>
        <p className="text-2xl font-bold text-white">{portfolioData.length}</p>
      </Card>
      <Card className="text-center">
        <h3 className="text-slate-400 text-sm">Total Gain/Loss</h3>
        <p
          className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString()}
        </p>
      </Card>
      <Card className="text-center">
        <h3 className="text-slate-400 text-sm">Return %</h3>
        <p
          className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {totalGainLossPercent >= 0 ? "+" : ""}
          {totalGainLossPercent.toFixed(2)}%
        </p>
      </Card>
    </div>
  );
};

// This is a simplified utility to calculate weighted portfolio returns on the client-side.
const calculatePortfolioReturns = (portfolioData, assetReturnsData) => {
  if (!portfolioData || portfolioData.length === 0 || !assetReturnsData)
    return [];
  const totalValue = portfolioData.reduce(
    (sum, pos) => sum + (pos.market_value || 0),
    0
  );
  if (totalValue === 0) return [];
  const weights = {};
  portfolioData.forEach((pos) => {
    weights[pos.symbol] = (pos.market_value || 0) / totalValue;
  });
  const symbols = Object.keys(weights);
  const firstSymbol = symbols[0];
  if (!assetReturnsData[firstSymbol]) return [];
  const numReturns = assetReturnsData[firstSymbol].length;
  const portfolioReturns = new Array(numReturns).fill(0);
  for (let i = 0; i < numReturns; i++) {
    let dailyPortfolioReturn = 0;
    for (const symbol of symbols) {
      if (
        assetReturnsData[symbol] &&
        assetReturnsData[symbol][i] !== undefined
      ) {
        dailyPortfolioReturn += assetReturnsData[symbol][i] * weights[symbol];
      }
    }
    portfolioReturns[i] = dailyPortfolioReturn;
  }
  return portfolioReturns;
};

export const AnalyticsPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // --- STEP 2: Use the portfolio hook to get the user's holdings ---
  const {
    data: portfolioData,
    loading: portfolioLoading,
    error: portfolioError,
  } = usePortfolioData();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // --- STEP 3: Add guards to prevent fetching without a portfolio ---
    if (!isAuthenticated || !portfolioData || portfolioData.length === 0) {
      setIsLoading(false);
      setAnalyticsData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // This logic now only runs if there is a portfolio.
      // NOTE: This simulates fetching historical data for the portfolio.
      // You would replace this with a real API call.
      const mockAssetReturns = {};
      portfolioData.forEach((pos) => {
        mockAssetReturns[pos.symbol] = Array.from(
          { length: 252 },
          () => (Math.random() - 0.5) * 0.04
        );
      });
      const portfolioReturns = calculatePortfolioReturns(
        portfolioData,
        mockAssetReturns
      );
      const portfolioTimeSeries = portfolioReturns.reduce(
        (acc, r) => [...acc, acc[acc.length - 1] * (1 + r)],
        [100]
      );

      if (portfolioReturns.length < 50) {
        throw new Error("Insufficient historical data to perform analysis.");
      }

      // --- STEP 4: Call analysis services with REAL portfolio-derived data ---
      const [hurstRes, garchRes] = await Promise.all([
        analysisService.getHurstExponent({ data: portfolioTimeSeries }),
        analysisService.getGarchForecast({ returns: portfolioReturns }),
      ]);

      setAnalyticsData({
        hurst: hurstRes.data,
        garch: garchRes.data,
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "An unknown error occurred.";
      console.error("Analytics fetch error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, portfolioData]); // Dependency array is now correct

  useEffect(() => {
    // This effect now waits for both auth and portfolio data to be ready
    if (!authLoading && !portfolioLoading) {
      fetchData();
    }
  }, [authLoading, portfolioLoading, fetchData]);

  const renderContent = () => {
    if (authLoading || portfolioLoading || isLoading) {
      return (
        <div className="flex justify-center items-center h-full p-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
    }

    if (error || portfolioError) {
      return (
        <ErrorDisplay error={error || portfolioError} onRetry={fetchData} />
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-white">
            Authentication Required
          </h2>
          <p className="text-slate-400 mt-2">
            Please log in to view analytics.
          </p>
        </div>
      );
    }

    if (!portfolioData || portfolioData.length === 0) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto w-12 h-12 text-cyan-500 mb-4" />
          <h2 className="text-xl font-semibold text-white">
            No Portfolio Data
          </h2>
          <p className="text-slate-400 mt-2">
            Please add positions on the Portfolio page to run analytics.
          </p>
        </div>
      );
    }

    // --- SUCCESS STATE ---
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">
          Portfolio Analytics Dashboard
        </h2>

        {/* Portfolio Summary Cards */}
        <PortfolioSummary portfolioData={portfolioData} />

        {/* Portfolio Allocation Chart */}
        <PortfolioAllocationChart
          portfolioData={portfolioData}
          isLoading={portfolioLoading}
          error={portfolioError}
          variant="dashboard"
        />

        {/* Analytics Data Cards */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-slate-400">Hurst Exponent (Portfolio)</h3>
              <p className="text-3xl font-bold text-white mt-2">
                {analyticsData.hurst?.hurst_exponent?.toFixed(4)}
              </p>
              <p className="text-cyan-400 mt-1">
                {analyticsData.hurst?.interpretation}
              </p>
            </Card>
            <Card>
              <h3 className="text-slate-400">
                GARCH Volatility Forecast (Portfolio)
              </h3>
              <p className="text-3xl font-bold text-white mt-2">
                {analyticsData.garch?.data?.forecast_volatility?.[0]?.vol
                  ? `${(analyticsData.garch.data.forecast_volatility[0].vol * 100).toFixed(2)}%`
                  : "N/A"}
              </p>
              <p className="text-slate-400 mt-1">Next Day Forecast</p>
            </Card>
          </div>
        )}

        {/* Loading state for analytics data */}
        {!analyticsData && (
          <Card>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
              <span className="text-slate-400">
                Loading advanced analytics...
              </span>
            </div>
          </Card>
        )}
      </div>
    );
  };

  return <div className="p-4 md:p-6">{renderContent()}</div>;
};

export default AnalyticsPage;
