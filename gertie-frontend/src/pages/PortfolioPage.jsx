// src/pages/PortfolioPage.jsx
import React, { useState, useEffect } from "react";
import { portfolioService } from "../services/api";
import CSVUploader from "../components/portfolio/CSVUploader";
import PortfolioTable from "../components/portfolio/PortfolioTable";

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("PortfolioPage: Fetching portfolio data...");
      const portfolioData = await portfolioService.getPortfolio();

      console.log("PortfolioPage: Portfolio data received:", portfolioData);
      setPortfolio(portfolioData);
    } catch (err) {
      console.error("PortfolioPage: Error fetching portfolio:", err);
      setError(err.message || "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  // Load portfolio on component mount
  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Handle successful CSV upload
  const handleUploadSuccess = (uploadedData) => {
    console.log(
      "PortfolioPage: Upload successful, data received:",
      uploadedData
    );

    // Update portfolio state with uploaded data
    setPortfolio(uploadedData);

    // Also refresh from server to ensure sync
    setTimeout(() => {
      fetchPortfolio();
    }, 1000);
  };

  // Handle upload error
  const handleUploadError = (uploadError) => {
    console.error("PortfolioPage: Upload error:", uploadError);
    setError(`Upload failed: ${uploadError.message || "Unknown error"}`);
  };

  // Safe check for portfolio positions length
  const getPositionsCount = () => {
    if (!portfolio) return 0;

    // Handle different possible data structures
    if (Array.isArray(portfolio)) {
      return portfolio.length;
    }

    if (portfolio.positions && Array.isArray(portfolio.positions)) {
      return portfolio.positions.length;
    }

    if (
      portfolio.summary &&
      typeof portfolio.summary.total_positions === "number"
    ) {
      return portfolio.summary.total_positions;
    }

    return 0;
  };

  // Safe check for portfolio data existence
  const hasPositions = () => {
    return getPositionsCount() > 0;
  };

  console.log("PortfolioPage: Current state:", {
    portfolio,
    loading,
    error,
    positionsCount: getPositionsCount(),
    hasPositions: hasPositions(),
  });

  return (
    <div className="portfolio-page min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Portfolio Management
          </h1>
          <p className="text-slate-400">Welcome back, User!</p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <p className="text-slate-300 mb-6">
            Upload your entire portfolio via CSV or add individual positions
            manually. All entries will be merged with your existing portfolio.
          </p>

          <div className="flex gap-4 mb-6">
            <button className="bg-yellow-500 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
              📄 CSV Upload
            </button>
            <button className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors">
              ✏️ Manual Entry
            </button>
          </div>

          {/* CSV Uploader */}
          <CSVUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        {/* Portfolio Display Section */}
        <div className="portfolio-display">
          <h2 className="text-2xl font-bold text-white mb-4">
            Current Portfolio
          </h2>

          {/* Loading State */}
          {loading && !uploadLoading && (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading portfolio data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="bg-red-600 rounded-full p-2 mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-400 font-semibold">
                    Error Loading Portfolio
                  </h3>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchPortfolio}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Portfolio Table */}
          {!loading && !error && (
            <PortfolioTable
              portfolio={portfolio}
              loading={uploadLoading}
              error={error}
            />
          )}

          {/* Empty State */}
          {!loading && !error && !hasPositions() && (
            <div className="bg-slate-800 rounded-lg p-8 text-center">
              <div className="text-slate-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Portfolio Data
              </h3>
              <p className="text-slate-400 mb-4">
                Upload a CSV file or add positions manually to get started.
              </p>
              <p className="text-sm text-slate-500">
                Positions found: {getPositionsCount()}
              </p>
            </div>
          )}

          {/* Portfolio Summary */}
          {!loading && !error && hasPositions() && (
            <div className="mt-6 bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Portfolio Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Total Positions</p>
                  <p className="text-2xl font-bold text-white">
                    {getPositionsCount()}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-white">
                    $
                    {portfolio?.summary?.total_market_value?.toLocaleString() ||
                      "0"}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Last Updated</p>
                  <p className="text-sm text-white">
                    {portfolio?.last_updated
                      ? new Date(portfolio.last_updated).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
