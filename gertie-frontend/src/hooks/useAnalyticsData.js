import { useState, useEffect } from "react";
import { analyticsService } from "../services/api";

// A utility function to ensure all numbers in an array are valid
const cleanArray = (arr) => arr.filter((n) => Number.isFinite(n));

// Function to generate more realistic, GARCH-like returns
const generateGarchLikeReturns = (numPoints = 100) => {
  const returns = new Array(numPoints).fill(0);
  let sigma = new Array(numPoints).fill(0);
  sigma[0] = 0.01; // Initial volatility

  const alpha1 = 0.1;
  const beta1 = 0.85;
  const omega = 0.00001;

  for (let i = 1; i < numPoints; i++) {
    sigma[i] = Math.sqrt(
      omega +
        alpha1 * Math.pow(returns[i - 1], 2) +
        beta1 * Math.pow(sigma[i - 1], 2)
    );
    const randn =
      Math.sqrt(-2 * Math.log(1 - Math.random())) *
      Math.cos(2 * Math.PI * Math.random());
    returns[i] = sigma[i] * randn;
  }
  return returns;
};

export const useAnalyticsData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const mockReturns = generateGarchLikeReturns(100);
      const mockTimeSeries = mockReturns.reduce(
        (acc, r) => [...acc, acc[acc.length - 1] * Math.exp(r)],
        [100]
      );

      const cleanedTimeSeries = cleanArray(mockTimeSeries);
      const cleanedReturns = cleanArray(mockReturns);

      if (cleanedTimeSeries.length < 50 || cleanedReturns.length < 50) {
        throw new Error("Insufficient valid data generated for analysis.");
      }

      // --- MODIFIED: Use Promise.allSettled to handle partial failures ---
      const results = await Promise.allSettled([
        analyticsService.getHurstExponent(cleanedTimeSeries),
        analyticsService.getGarchForecast(cleanedReturns, 30),
        analyticsService.detectRegimes({ returns: cleanedReturns }, 3),
      ]);

      const [hurstResult, garchResult, regimeResult] = results;

      const finalData = {};
      const errors = [];

      // Check each result individually
      if (hurstResult.status === "fulfilled") {
        finalData.hurst = hurstResult.value;
      } else {
        errors.push("Hurst Exponent");
        console.error("Hurst fetch failed:", hurstResult.reason);
      }

      if (garchResult.status === "fulfilled") {
        finalData.garch = garchResult.value.data || garchResult.value;
      } else {
        errors.push("GARCH Forecast");
        console.error("GARCH fetch failed:", garchResult.reason);
      }

      if (regimeResult.status === "fulfilled") {
        finalData.regime = regimeResult.value.data || regimeResult.value;
      } else {
        errors.push("Market Regime");
        console.error("Regime fetch failed:", regimeResult.reason);
      }

      setData(finalData);

      if (errors.length > 0) {
        setError(`Failed to fetch: ${errors.join(", ")}.`);
      }
      // --- END of MODIFICATION ---
    } catch (err) {
      const errorMessage =
        err.data?.error?.message || err.message || "An unknown error occurred.";
      setError(`Failed to fetch analytics data: ${errorMessage}`);
      console.error("Analytics data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return { data, loading, error, refetch: fetchAnalyticsData };
};
