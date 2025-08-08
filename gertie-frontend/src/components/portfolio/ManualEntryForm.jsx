import React, { useState } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
// --- STEP 1: Import the new service ---
import { portfolioService } from "../../services/api";

const ManualEntryForm = ({ onSaveSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "",
    unit_cost: "",
    transaction_date: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Input handling and local state management for the form remains the same.
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPosition = () => {
    setError("");
    if (!formData.symbol || !formData.quantity || !formData.unit_cost) {
      setError("Ticker Symbol, Quantity, and Unit Cost are required.");
      return;
    }
    const newPosition = {
      id: Date.now(),
      symbol: formData.symbol.toUpperCase(),
      quantity: parseFloat(formData.quantity),
      unit_cost: parseFloat(formData.unit_cost),
      transaction_date: formData.transaction_date || null,
    };
    setPositions([...positions, newPosition]);
    setFormData({
      symbol: "",
      quantity: "",
      unit_cost: "",
      transaction_date: "",
    });
  };

  const handleRemovePosition = (id) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  // --- STEP 2: Refactor the handleSavePortfolio function ---
  const handleSavePortfolio = async () => {
    if (positions.length === 0) {
      setError("Add at least one position to save.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    const transactions_to_send = positions.map(({ id, ...rest }) => rest);

    try {
      // Use the centralized portfolioService instead of fetch.
      // The service handles the token, URL, and correct body structure.
      await portfolioService.addPositions(transactions_to_send);

      setSuccess("Portfolio saved successfully!");

      // CRITICAL: Call the portfolio refresh callback passed from the parent page.
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Reset form after a delay
      setTimeout(() => {
        setPositions([]);
        setSuccess("");
      }, 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save portfolio.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // The JSX for your component remains the same.
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 w-full max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold text-white mb-6">
        Add Positions Manually
      </h3>
      {/* ... Your existing JSX for form inputs and table ... */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Symbol Input */}
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Ticker Symbol *
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white"
            placeholder="E.G., AAPL"
          />
        </div>
        {/* Quantity, Cost, Date Inputs... */}
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white"
            placeholder="100"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Unit Cost *
          </label>
          <input
            type="number"
            name="unit_cost"
            value={formData.unit_cost}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white"
            placeholder="150.25"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium text-slate-300 block mb-2">
            Transaction Date
          </label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-600 rounded-md bg-slate-700 text-white"
          />
        </div>
        <div className="md:col-span-1 flex">
          <button
            onClick={handleAddPosition}
            className="w-full py-2 px-4 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-600 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add
          </button>
        </div>
      </div>

      {/* Save Button & Messages */}
      <div className="mt-8 flex items-center justify-end">
        <button
          onClick={handleSavePortfolio}
          disabled={loading || positions.length === 0}
          className="py-3 px-6 bg-yellow-500 text-slate-900 font-semibold rounded-md hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : `Save Portfolio (${positions.length})`}
        </button>
      </div>
    </div>
  );
};

export default ManualEntryForm;
