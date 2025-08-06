import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CSVUploader from "../components/portfolio/CSVUploader";
import ManualEntryForm from "../components/portfolio/ManualEntryForm";
import PortfolioTable from "../components/portfolio/PortfolioTable";
import { Upload, Edit, AlertCircle } from "lucide-react";

export const PortfolioPage = () => {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState("csv");
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // This function is now defined to be called from the useEffect hook
  const fetchPortfolio = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/portfolios/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch portfolio.");
      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortfolio();
    }
  }, [token]);

  // 2. CREATE THE DELETE HANDLER FUNCTION
  const handleDeletePosition = async (symbol) => {
    // Use window.confirm for a simple confirmation dialog
    if (
      window.confirm(
        `Are you sure you want to delete all positions for ${symbol}?`
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/portfolios/positions/${symbol}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete position.");
        }

        // On success, update the UI instantly by filtering the local state
        setPortfolio((prevPortfolio) =>
          prevPortfolio.filter((pos) => pos.symbol !== symbol)
        );
      } catch (err) {
        // Display the error to the user
        setError(err.message);
      }
    }
  };

  // This function will be passed to the uploader/manual form components
  // so they can trigger a refresh of the portfolio table after a successful save.
  const handlePortfolioUpdate = () => {
    fetchPortfolio();
  };

  return (
    <div className="text-white space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4 text-center">
          Portfolio Management
        </h1>
        <p className="text-center text-slate-400 mb-8 max-w-2xl mx-auto">
          Upload your entire portfolio via CSV or add individual positions
          manually. All entries will be merged with your existing portfolio.
        </p>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveView("csv")}
            className={`py-2 px-5 rounded-lg flex items-center font-semibold transition-colors ${activeView === "csv" ? "bg-yellow-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600"}`}
          >
            <Upload className="w-5 h-5 mr-2" /> CSV Upload
          </button>
          <button
            onClick={() => setActiveView("manual")}
            className={`py-2 px-5 rounded-lg flex items-center font-semibold transition-colors ${activeView === "manual" ? "bg-yellow-500 text-slate-900" : "bg-slate-700 hover:bg-slate-600"}`}
          >
            <Edit className="w-5 h-5 mr-2" /> Manual Entry
          </button>
        </div>

        <div className="flex justify-center">
          {/* Pass the refresh function to the components */}
          {activeView === "csv" ? (
            <CSVUploader onUploadSuccess={handlePortfolioUpdate} />
          ) : (
            <ManualEntryForm onSaveSuccess={handlePortfolioUpdate} />
          )}
        </div>
      </div>

      <hr className="border-slate-700" />

      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Current Portfolio
        </h2>
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <p className="text-center text-slate-400">Loading portfolio...</p>
          ) : error ? (
            <div className="flex items-center justify-center text-red-400 bg-red-900/30 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-2" /> {error}
            </div>
          ) : (
            // 3. PASS THE DELETE HANDLER AS A PROP
            <PortfolioTable
              portfolio={portfolio}
              onDelete={handleDeletePosition}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
