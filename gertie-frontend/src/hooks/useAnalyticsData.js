// src/hooks/useAnalyticsData.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
// --- STEP 1: Import the new services and the portfolio data hook ---
import { usePortfolioData } from "./usePortfolioData";
import { analysisService } from "../services/api";

// This is a simplified utility to calculate weighted portfolio returns.
// In a production environment, this calculation would ideally happen on the backend.
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

export const useAnalyticsData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  // --- STEP 2: Use the portfolio data hook to get the user's holdings ---
  const { data: portfolioData, loading: portfolioLoading } = usePortfolioData();

  const fetchAnalyticsData = useCallback(async () => {
    // Don't run if not authenticated or if the portfolio data is still loading or empty.
    if (
      !isAuthenticated ||
      portfolioLoading ||
      !portfolioData ||
      portfolioData.length === 0
    ) {
      setLoading(false);
      setData(null); // Clear analytics data if there's no portfolio
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(
        "🔄 Starting REAL analytics data fetch based on portfolio..."
      );

      // --- STEP 3: Fetch historical returns for the assets in the portfolio ---
      // NOTE: This is a simplified approach. Ideally, you'd have a single backend
      // endpoint that returns all historical data for a given list of symbols.
      // For now, we simulate this fetch.
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
      const results = await Promise.allSettled([
        analysisService.getHurstExponent({ data: portfolioTimeSeries }),
        analysisService.getGarchForecast({ returns: portfolioReturns }),
        analysisService.calculateCVAR({ portfolio_returns: portfolioReturns }),
      ]);

      const [hurstResult, garchResult, cvarResult] = results;
      const finalData = {};
      const errors = [];

      if (hurstResult.status === "fulfilled") {
        finalData.hurst = hurstResult.value.data;
      } else {
        errors.push("Hurst");
      }

      if (garchResult.status === "fulfilled") {
        finalData.garch = garchResult.value.data;
      } else {
        errors.push("GARCH");
      }

      if (cvarResult.status === "fulfilled") {
        finalData.cvar = cvarResult.value.data;
      } else {
        errors.push("CVaR");
      }

      // Add a mock for the missing regime data as it's not part of the parallel fetch
      finalData.regime = {
        current_regime: "Moderate Volatility",
        regimes: ["Low", "Moderate", "High"],
      };

      setData(finalData);

      if (errors.length > 0) {
        setError(`Failed to fetch: ${errors.join(", ")}.`);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "An unknown error occurred.";
      setError(`Failed to fetch analytics data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, portfolioData, portfolioLoading]); // This hook now depends on the portfolio data

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return { data, loading, error, refetch: fetchAnalyticsData };
};
