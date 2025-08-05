import React, { useState } from "react";
import CSVUploader from "../components/portfolio/CSVUploader";
import ManualEntryForm from "../components/portfolio/ManualEntryForm";
import { Upload, Edit3 } from "lucide-react";

export const PortfolioPage = () => {
  // State to track which view is active
  const [activeView, setActiveView] = useState("csv"); // 'csv' or 'manual'

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Portfolio Management
      </h1>

      {/* Toggle Buttons */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveView("csv")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "csv"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            CSV Upload
          </button>

          <button
            onClick={() => setActiveView("manual")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "manual"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Content based on active view */}
      <div className="flex justify-center">
        {activeView === "csv" ? (
          <div className="w-full">
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-300">
              Upload Portfolio from CSV
            </h2>
            <CSVUploader />
          </div>
        ) : (
          <div className="w-full">
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-300">
              Add Positions Manually
            </h2>
            <ManualEntryForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
