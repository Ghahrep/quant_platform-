import { useState, useEffect } from "react";
// Assuming you will create a dedicated 'portfolioService' in your api.js file
import { portfolioService } from "../services/api";

// Mock data to be used if the API is not yet connected
const mockAllocationData = {
  byCategory: [
    { name: "ETFs", value: 24000 },
    { name: "Bonds", value: 12000 },
    { name: "Healthcare", value: 8500 },
    { name: "Tech", value: 3000 },
    { name: "Cash", value: 5300 },
  ],
  optimizationSuggestion: {
    rationale:
      "Increase cash allocation due to elevated market volatility and detected mean-reverting signals in tech.",
    expected_improvement: {
      risk_reduction: 0.02,
      expected_return_change: -0.001,
    },
  },
};

export const useAllocationsData = (portfolioId = "default_portfolio") => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllocationsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real scenario, you would have separate endpoints for these.
      // For now, we simulate fetching them together.
      // We will use the mock data as a placeholder.

      // Example of what a real API call might look like:
      // const optimizationResponse = await portfolioService.getOptimizationSuggestions(portfolioId);

      // Simulating a successful fetch with mock data
      setData(mockAllocationData);
    } catch (err) {
      setError(
        err.message ||
          "An unknown error occurred while fetching allocation data."
      );
      console.error("Allocations data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocationsData();
  }, [portfolioId]); // Re-fetch if the portfolioId changes

  return { data, loading, error, refetch: fetchAllocationsData };
};
