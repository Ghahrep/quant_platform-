// src/hooks/useRiskMetrics.js
import { useState, useEffect } from "react";
import { riskService } from "../services/api";

export const useRiskMetrics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate mock portfolio returns
      const mockReturns = Array.from(
        { length: 100 },
        () => (Math.random() - 0.5) * 0.1
      );

      // Get risk metrics and stress test
      const [cvarResponse, stressResponse] = await Promise.all([
        riskService.calculateCVaR(mockReturns, 0.95),
        riskService.runStressTest(
          {
            AAPL: 0.3,
            GOOGL: 0.25,
            MSFT: 0.25,
            CASH: 0.2,
          },
          [
            {
              scenario_name: "market_crash_2008",
              asset_shocks: { AAPL: -0.4, GOOGL: -0.35, MSFT: -0.3 },
            },
          ]
        ),
      ]);

      setData({
        cvar: cvarResponse.data || cvarResponse,
        stressTest: stressResponse.data || stressResponse,
        overallRiskScore: 3.2,
        valueAtRisk:
          Math.abs(cvarResponse.data?.cvar_estimate || -0.254) * 100000,
      });
    } catch (err) {
      setError(err.message);
      console.error("Risk data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  return { data, loading, error, refetch: fetchRiskData };
};
