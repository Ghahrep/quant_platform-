import { useState, useEffect } from "react";
import { portfolioService, analyticsService } from "../services/api";

export const useRiskMetrics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get risk metrics and run stress test
      const [riskResponse, stressResponse] = await Promise.all([
        portfolioService.getRiskMetrics(),
        analyticsService.runStressTest(
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
        cvar: riskResponse.data || riskResponse,
        stressTest: stressResponse.data || stressResponse,
        overallRiskScore: 3.2,
        valueAtRisk: riskResponse.data?.cvar_estimate || 25400.0,
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
