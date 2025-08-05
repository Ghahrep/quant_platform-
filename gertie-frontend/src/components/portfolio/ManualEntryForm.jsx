// Clear all positions from session with confirmation
const handleClearAll = () => {
  if (
    window.confirm(
      `Remove all ${sessionPositions.length} positions from the list?`
    )
  ) {
    setSessionPositions([]);
    setSaveStatus(null);
    setSaveMessage("");
  }
}; // ManualEntryForm.jsx - Basic form structure for manual portfolio entry
import React, { useState } from "react";
import {
  Plus,
  AlertCircle,
  X,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";

const ManualEntryForm = () => {
  // Form state for current position being entered
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    unitCost: "",
    transactionDate: "",
  });

  // Array to store positions being added in this session
  const [sessionPositions, setSessionPositions] = useState([]);

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Loading state for save operation
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  const [saveMessage, setSaveMessage] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form data with duplicate detection
  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Ticker symbol is required";
    } else if (!/^[A-Z]{1,10}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = "Enter a valid ticker symbol (e.g., AAPL)";
    } else {
      // Check for duplicate symbols in session
      const symbolExists = sessionPositions.some(
        (pos) => pos.symbol === formData.symbol.toUpperCase()
      );
      if (symbolExists) {
        newErrors.symbol = `${formData.symbol.toUpperCase()} already added. You can add multiple lots of the same stock.`;
      }
    }

    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    } else if (parseInt(formData.quantity) > 1000000) {
      newErrors.quantity = "Quantity seems unusually high. Please verify.";
    }

    if (!formData.unitCost) {
      newErrors.unitCost = "Unit cost is required";
    } else if (parseFloat(formData.unitCost) <= 0) {
      newErrors.unitCost = "Unit cost must be greater than 0";
    } else if (parseFloat(formData.unitCost) > 100000) {
      newErrors.unitCost = "Unit cost seems unusually high. Please verify.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleAddPosition = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Create new position object
      const newPosition = {
        id: Date.now(), // Simple ID for removal
        symbol: formData.symbol.toUpperCase(),
        quantity: parseInt(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        transactionDate: formData.transactionDate || null,
      };

      // Add to session positions
      setSessionPositions((prev) => [...prev, newPosition]);

      console.log("Position added to session:", newPosition);

      // Clear form after successful addition
      setFormData({
        symbol: "",
        quantity: "",
        unitCost: "",
        transactionDate: "",
      });
    }
  };

  // Remove position from session with confirmation
  const handleRemovePosition = (positionId) => {
    const position = sessionPositions.find((pos) => pos.id === positionId);
    if (
      position &&
      window.confirm(
        `Remove ${position.symbol} (${position.quantity} shares) from the list?`
      )
    ) {
      setSessionPositions((prev) =>
        prev.filter((pos) => pos.id !== positionId)
      );
    }
  };

  // Save portfolio to backend
  const handleSavePortfolio = async () => {
    if (sessionPositions.length === 0) return;

    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage("Saving portfolio...");

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      // Transform session positions to backend format
      const transactions = sessionPositions.map((position) => ({
        symbol: position.symbol,
        quantity: position.quantity,
        unit_cost: position.unitCost,
        transaction_date: position.transactionDate,
      }));

      // Make API call to manual positions endpoint
      const response = await fetch(
        "http://localhost:8000/api/v1/portfolios/positions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactions),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Save failed");
      }

      // Success
      setSaveStatus("success");
      setSaveMessage(result.message || "Portfolio saved successfully!");

      // Clear session after successful save
      setTimeout(() => {
        setSessionPositions([]);
        setSaveStatus(null);
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setSaveMessage(
        error.message || "Failed to save portfolio. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Add Position Manually
        </h3>

        <form onSubmit={handleAddPosition} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ticker Symbol Input */}
            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ticker Symbol *
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="e.g., AAPL"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                  errors.symbol ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                style={{ textTransform: "uppercase" }}
              />
              {errors.symbol && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.symbol}
                </div>
              )}
            </div>

            {/* Quantity Input */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="100"
                min="1"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                  errors.quantity
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {errors.quantity && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.quantity}
                </div>
              )}
            </div>

            {/* Unit Cost Input */}
            <div>
              <label
                htmlFor="unitCost"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unit Cost * ($)
              </label>
              <input
                type="number"
                id="unitCost"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleInputChange}
                placeholder="150.25"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 ${
                  errors.unitCost
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {errors.unitCost && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.unitCost}
                </div>
              )}
            </div>

            {/* Transaction Date Input */}
            <div>
              <label
                htmlFor="transactionDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Transaction Date
              </label>
              <input
                type="date"
                id="transactionDate"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Optional</p>
            </div>
          </div>

          {/* Add Position Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </button>
          </div>
        </form>
      </div>

      {/* Save Status Messages */}
      {saveMessage && (
        <div
          className={`mb-6 flex items-center space-x-2 p-4 rounded-md ${
            saveStatus === "success"
              ? "bg-green-50 text-green-800"
              : saveStatus === "error"
                ? "bg-red-50 text-red-800"
                : "bg-blue-50 text-blue-800"
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saveStatus === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : saveStatus === "error" ? (
            <AlertCircle className="w-5 h-5" />
          ) : null}
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}

      {/* Dynamic Positions Table */}
      {sessionPositions.length > 0 ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Positions to Save ({sessionPositions.length})
            </h3>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Total Value
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessionPositions.map((position) => (
                  <tr key={position.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {position.symbol}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {position.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${position.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {position.transactionDate || "Not specified"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${(position.quantity * position.unitCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemovePosition(position.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Remove position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Portfolio Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSavePortfolio}
              disabled={isSaving || sessionPositions.length === 0}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                `Save Portfolio (${sessionPositions.length} position${sessionPositions.length !== 1 ? "s" : ""})`
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">Positions you add will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ManualEntryForm;
