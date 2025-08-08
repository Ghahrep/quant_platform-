// src/components/portfolio/CSVUploader.jsx
import React, { useState } from "react";
import Papa from "papaparse";
import { portfolioService } from "../../services/api";

const CSVUploader = ({ onUploadSuccess, onUploadError }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Required CSV columns and their possible variations
  const REQUIRED_COLUMNS = {
    symbol: ["symbol", "Symbol", "SYMBOL", "ticker", "Ticker"],
    quantity: ["quantity", "Quantity", "QUANTITY", "shares", "Shares"],
    unitCost: [
      "unitcost",
      "UnitCost",
      "unit_cost",
      "UNITCOST",
      "price",
      "Price",
      "cost",
      "Cost",
    ],
    transactionDate: [
      "transactiondate",
      "TransactionDate",
      "transaction_date",
      "TRANSACTIONDATE",
      "date",
      "Date",
    ],
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    setError(null);
    setValidationErrors([]);
    setParsedData(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (csvFile) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for validation
      delimitersToGuess: [",", "\t", "|", ";"],
      complete: (results) => {
        console.log("CSV Parse Results:", results);

        if (results.errors.length > 0) {
          setError(
            `CSV parsing errors: ${results.errors.map((e) => e.message).join(", ")}`
          );
          return;
        }

        if (!results.data || results.data.length === 0) {
          setError("CSV file appears to be empty.");
          return;
        }

        const validationResult = validateCSVData(
          results.data,
          results.meta.fields
        );
        if (validationResult.isValid) {
          setParsedData({
            data: validationResult.normalizedData,
            meta: results.meta,
            originalData: results.data,
          });
        } else {
          setValidationErrors(validationResult.errors);
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const validateCSVData = (data, headers) => {
    const errors = [];
    const normalizedData = [];

    // Check for required columns
    const columnMapping = {};

    for (const [requiredCol, variations] of Object.entries(REQUIRED_COLUMNS)) {
      const foundColumn = headers.find((header) =>
        variations.some(
          (variation) => header.toLowerCase().trim() === variation.toLowerCase()
        )
      );

      if (!foundColumn) {
        errors.push(
          `Missing required column: ${requiredCol}. Expected one of: ${variations.join(", ")}`
        );
      } else {
        columnMapping[requiredCol] = foundColumn;
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate and normalize each row
    data.forEach((row, index) => {
      const rowErrors = [];
      const normalizedRow = {};

      // Symbol validation
      const symbol = (row[columnMapping.symbol] || "")
        .toString()
        .trim()
        .toUpperCase();
      if (!symbol) {
        rowErrors.push(`Row ${index + 1}: Symbol is required`);
      } else if (!/^[A-Z]{1,10}$/.test(symbol)) {
        rowErrors.push(
          `Row ${index + 1}: Invalid symbol format '${symbol}'. Expected 1-10 uppercase letters.`
        );
      }
      normalizedRow.symbol = symbol;

      // Quantity validation
      const quantityStr = (row[columnMapping.quantity] || "").toString().trim();
      const quantity = parseFloat(quantityStr);
      if (!quantityStr || isNaN(quantity) || quantity <= 0) {
        rowErrors.push(
          `Row ${index + 1}: Quantity must be a positive number, got '${quantityStr}'`
        );
      }
      normalizedRow.quantity = quantity;

      // Unit Cost validation
      const unitCostStr = (row[columnMapping.unitCost] || "").toString().trim();
      const unitCost = parseFloat(unitCostStr);
      if (!unitCostStr || isNaN(unitCost) || unitCost <= 0) {
        rowErrors.push(
          `Row ${index + 1}: Unit cost must be a positive number, got '${unitCostStr}'`
        );
      }
      normalizedRow.unit_cost = unitCost;

      // Transaction Date validation
      const dateStr = (row[columnMapping.transactionDate] || "")
        .toString()
        .trim();
      if (!dateStr) {
        rowErrors.push(`Row ${index + 1}: Transaction date is required`);
      } else {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          rowErrors.push(
            `Row ${index + 1}: Invalid date format '${dateStr}'. Use YYYY-MM-DD or MM/DD/YYYY.`
          );
        } else if (date > new Date()) {
          rowErrors.push(
            `Row ${index + 1}: Transaction date cannot be in the future`
          );
        } else {
          // Normalize to ISO date string
          normalizedRow.transaction_date = date.toISOString().split("T")[0];
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        normalizedData.push(normalizedRow);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData,
    };
  };

  const handleUpload = async () => {
    if (!parsedData || !parsedData.data) {
      setError(
        "No valid data to upload. Please select and validate a CSV file first."
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log("Uploading CSV data:", parsedData.data);

      // Check if backend expects FormData or JSON
      // Let's try both approaches based on common patterns

      // Method 1: Try sending parsed JSON data directly
      try {
        console.log("Attempting JSON upload...");
        const response = await portfolioService.uploadCSVData(parsedData.data);

        console.log("JSON upload successful:", response);

        if (response && response.data) {
          setParsedData(null);
          setFile(null);
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
        } else {
          throw new Error("Invalid response from server");
        }
        return; // Success, exit early
      } catch (jsonError) {
        console.log("JSON upload failed, trying FormData...", jsonError);

        // Method 2: Fallback to FormData if JSON fails
        const formData = new FormData();
        formData.append("file", file);

        console.log("FormData entries:", Array.from(formData.entries()));

        const response = await portfolioService.uploadCSV(formData);

        console.log("FormData upload successful:", response);

        if (response && response.data) {
          setParsedData(null);
          setFile(null);
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);

      let errorMessage = "Failed to upload portfolio data.";

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        if (status === 422) {
          errorMessage = `Validation Error: ${data.detail || "Invalid data format"}`;
          if (data.detail && Array.isArray(data.detail)) {
            errorMessage +=
              "\n" +
              data.detail
                .map((err) => `${err.loc?.join(".") || "Field"}: ${err.msg}`)
                .join("\n");
          }
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = data.message || data.detail || errorMessage;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setValidationErrors([]);
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="csv-uploader">
      <div className="upload-section">
        <h3>Upload Portfolio CSV</h3>
        <p>
          Upload a CSV file with your portfolio data. Required columns: Symbol,
          Quantity, Unit Cost, Transaction Date
        </p>

        <div className="file-input-container">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="file-input"
          />
          {file && (
            <div className="file-info">
              <span>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button onClick={clearFile} className="btn btn-sm btn-outline">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <h4>Upload Error</h4>
            <pre>{error}</pre>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <h4>Validation Errors ({validationErrors.length})</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Preview */}
        {parsedData && (
          <div className="data-preview">
            <h4>Data Preview ({parsedData.data.length} rows)</h4>
            <div className="table-responsive">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Transaction Date</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.data.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td>{row.symbol}</td>
                      <td>{row.quantity}</td>
                      <td>${row.unit_cost.toFixed(2)}</td>
                      <td>{row.transaction_date}</td>
                      <td>${(row.quantity * row.unit_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.data.length > 5 && (
                <p>... and {parsedData.data.length - 5} more rows</p>
              )}
            </div>

            <div className="upload-actions">
              <button
                onClick={handleUpload}
                disabled={isUploading || validationErrors.length > 0}
                className="btn btn-primary"
              >
                {isUploading
                  ? "Uploading..."
                  : `Upload ${parsedData.data.length} Positions`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUploader;
