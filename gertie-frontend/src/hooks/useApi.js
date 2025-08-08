import { useState, useEffect, useCallback } from "react";
// No direct API imports are needed here; the hook is generic.

/**
 * A generic hook for making API calls using a service function.
 * It handles loading, error, and data states, and provides a refetch function.
 *
 * @param {Function} apiFunction The function from your api.js service (e.g., portfolioService.getPortfolio).
 * @param {Array} dependencies An array of dependencies that will trigger a refetch when they change (optional).
 * @param {boolean} lazy If true, the API call will not run on mount and must be triggered by calling 'fetchData'.
 */
export function useApi(apiFunction, dependencies = [], lazy = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!lazy); // Only start loading on mount if not lazy
  const [error, setError] = useState(null);

  // useCallback ensures the fetchData function is not recreated on every render,
  // preventing infinite loops when it's used in a useEffect dependency array.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Execute the passed-in API service function
      const response = await apiFunction();

      // Axios wraps the actual JSON body in a `data` property
      setData(response.data);
    } catch (err) {
      // Handle Axios-specific error structure, falling back to a generic message.
      const errorMessage =
        err.response?.data?.detail || err.message || "An API error occurred.";
      console.error("useApi Error:", {
        message: errorMessage,
        status: err.response?.status,
        fullError: err,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, ...dependencies]); // Recreate the function if the apiFunction or dependencies change

  useEffect(() => {
    // If the hook is not lazy, run the fetch on mount.
    if (!lazy) {
      fetchData();
    }
  }, [fetchData, lazy]); // Effect depends on our stable fetchData function

  // Return the state and the fetchData function (renamed to 'refetch' for clarity)
  return { data, loading, error, refetch: fetchData };
}
