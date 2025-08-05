import React, { useState } from "react";
import { riskService } from "../services/api";

export const RiskServiceTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testCVaR = async () => {
    setLoading((prev) => ({ ...prev, cvar: true }));
    try {
      const mockReturns = Array.from(
        { length: 100 },
        () => (Math.random() - 0.5) * 0.1
      );
      const result = await riskService.calculateCVaR(mockReturns, 0.95);
      setResults((prev) => ({
        ...prev,
        cvar: { success: true, data: result },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        cvar: { success: false, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, cvar: false }));
    }
  };

  const testStressTest = async () => {
    setLoading((prev) => ({ ...prev, stress: true }));
    try {
      const result = await riskService.runStressTest(
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
      );
      setResults((prev) => ({
        ...prev,
        stress: { success: true, data: result },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        stress: { success: false, error: error.message },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, stress: false }));
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg m-4">
      <h3 className="text-lg font-bold text-white mb-4">Risk Service Tests</h3>

      <div className="space-y-4">
        <div>
          <button
            onClick={testCVaR}
            disabled={loading.cvar}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading.cvar ? "Testing CVaR..." : "Test CVaR Calculation"}
          </button>
          {results.cvar && (
            <pre className="mt-2 text-xs text-green-400 bg-slate-900 p-2 rounded overflow-auto">
              {JSON.stringify(results.cvar, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <button
            onClick={testStressTest}
            disabled={loading.stress}
            className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading.stress ? "Testing Stress Test..." : "Test Stress Test"}
          </button>
          {results.stress && (
            <pre className="mt-2 text-xs text-green-400 bg-slate-900 p-2 rounded overflow-auto">
              {JSON.stringify(results.stress, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
