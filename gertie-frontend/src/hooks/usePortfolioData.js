// src/hooks/usePortfolioData.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
// --- STEP 1: Import the new service ---
import { portfolioService } from "../services/api";

export const usePortfolioData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth(); // Use isAuthenticated for a clearer check

  // --- STEP 2: Create a single, memoized fetch function ---
  const fetchPortfolioData = useCallback(async () => {
    // Don't attempt to fetch if the user isn't authenticated
    if (!isAuthenticated) {
      setData([]); // Ensure data is cleared on logout
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use the centralized portfolioService. It handles the token and URL automatically.
      const response = await portfolioService.getPortfolio();

      // Axios wraps the response body in a `data` property
      setData(response.data);
    } catch (err) {
      console.error("Portfolio fetch error in usePortfolioData hook:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch portfolio data.";

      // A 404 from this endpoint often just means the user has an empty portfolio,
      // which isn't a critical error we need to display.
      if (err.response?.status === 404) {
        setData([]); // Set data to empty array
      } else {
        setError(errorMessage);
        setData([]); // Clear data on other errors
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // Dependency array ensures this function is stable

  // --- STEP 3: Call the fetch function on mount or when auth state changes ---
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // --- STEP 4: Expose the fetch function as 'refetch' ---
  // This allows components using the hook to trigger a manual refresh.
  return { data, loading, error, refetch: fetchPortfolioData };
};
