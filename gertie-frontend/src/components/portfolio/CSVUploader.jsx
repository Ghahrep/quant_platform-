// Updated CSVUploader.jsx with complete API integration
import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";
import DataPreviewTable from "./DataPreviewTable";

const CSVUploader = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [statusMessage, setStatusMessage] = useState("");
  const [portfolioSummary, setPortfolioSummary] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setStatusMessage("Please select a CSV file.");
      setUploadStatus("error");
      return;
    }

    // Clear previous state
    setFile(selectedFile);
    setParsedData(null);
    setUploadStatus(null);
    setStatusMessage("");
    setPortfolioSummary(null);

    // Parse CSV file
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          setStatusMessage("Error parsing CSV file. Please check the format.");
          setUploadStatus("error");
          return;
        }

        // Validate required columns - support both UnitCost and AverageCost
        const headers = Object.keys(results.data[0] || {});
        const requiredColumns = ["Symbol", "Quantity"];
        const costColumn = headers.includes("UnitCost")
          ? "UnitCost"
          : headers.includes("AverageCost")
            ? "AverageCost"
            : null;

        if (!costColumn) {
          setStatusMessage(
            "Missing required cost column: UnitCost or AverageCost"
          );
          setUploadStatus("error");
          return;
        }

        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          setStatusMessage(
            `Missing required columns: ${missingColumns.join(", ")}`
          );
          setUploadStatus("error");
          return;
        }

        // Validate data format
        const validatedData = results.data.filter((row) => {
          const costValue = row[costColumn];
          return (
            row.Symbol &&
            typeof row.Quantity === "number" &&
            row.Quantity > 0 &&
            typeof costValue === "number" &&
            costValue > 0
          );
        });

        if (validatedData.length === 0) {
          setStatusMessage("No valid data rows found in CSV file.");
          setUploadStatus("error");
          return;
        }

        setParsedData(validatedData);
        setStatusMessage(
          `Successfully parsed ${validatedData.length} transactions.`
        );
        setUploadStatus("success");
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setStatusMessage("Failed to parse CSV file.");
        setUploadStatus("error");
      },
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const handleUpload = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    setUploadStatus(null);
    setStatusMessage("Uploading portfolio...");

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      // Transform data to match backend model - handle both AverageCost and UnitCost
      const transactions = parsedData.map((row) => ({
        symbol: row.Symbol,
        quantity: row.Quantity,
        unit_cost: row.UnitCost || row.AverageCost, // Support both column names
        transaction_date: row.TransactionDate || null,
      }));

      // Make API call
      const response = await fetch(
        "http://localhost:8000/api/v1/portfolios/upload/csv",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactions: transactions,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Upload failed");
      }

      // Success
      setUploadStatus("success");
      setStatusMessage(result.message);
      setPortfolioSummary(result.portfolio_summary);

      // Clear form after successful upload
      setTimeout(() => {
        setFile(null);
        setParsedData(null);
        setUploadStatus(null);
        setStatusMessage("");
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setStatusMessage(
        error.message || "Failed to upload portfolio. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("csv-file-input").click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Portfolio CSV
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your CSV file here, or click to select
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Select File
        </button>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* File Selected Indicator */}
      {file && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{file.name}</span>
          <span className="text-sm text-gray-600">
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`flex items-center space-x-2 p-4 rounded-md ${
            uploadStatus === "success"
              ? "bg-green-50 text-green-800"
              : uploadStatus === "error"
                ? "bg-red-50 text-red-800"
                : "bg-blue-50 text-blue-800"
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : uploadStatus === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : uploadStatus === "error" ? (
            <AlertCircle className="w-5 h-5" />
          ) : null}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Data Preview */}
      {parsedData && !portfolioSummary && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
          <DataPreviewTable data={parsedData} maxRows={5} />

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isUploading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </span>
            ) : (
              "Upload Portfolio"
            )}
          </button>
        </div>
      )}

      {/* Portfolio Summary After Upload */}
      {portfolioSummary && portfolioSummary.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Your Updated Portfolio
          </h3>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Total Shares
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Avg Cost
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolioSummary.map((position, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {position.symbol}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {position.total_quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${position.weighted_average_cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${position.total_cost_basis.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;
