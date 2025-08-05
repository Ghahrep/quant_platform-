import { useState, useEffect } from "react";
// Assuming you will add a getAlerts function to a service in api.js
import { portfolioService } from "../services/api";

// Mock data to be used if the API is not yet connected or fails
const mockAlertsData = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Portfolio Value at Risk (VaR) Breach",
    description: "95% VaR of $25,400 has exceeded the limit of $25,000.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: "alert-2",
    severity: "warning",
    title: "High Concentration in Tech Sector",
    description:
      "Exposure to the Technology sector is at 38%, above the recommended 30% threshold.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "alert-3",
    severity: "info",
    title: "Strategy Rebalancing Suggested",
    description:
      "AI analysis suggests rebalancing to optimize for lower volatility.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

export const useAlertsData = (portfolioId = "default_portfolio") => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real scenario, you would call your API endpoint here.
      // For now, we simulate a successful fetch with mock data.

      // Example of what a real API call might look like:
      // const response = await portfolioService.getAlerts(portfolioId);
      // setData(response.data);

      // Simulating a successful fetch with mock data after a short delay
      setTimeout(() => {
        setData(mockAlertsData);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(
        err.message || "An unknown error occurred while fetching alerts."
      );
      console.error("Alerts data fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [portfolioId]); // Re-fetch if the portfolioId changes

  return { data, loading, error, refetch: fetchAlertsData };
};
