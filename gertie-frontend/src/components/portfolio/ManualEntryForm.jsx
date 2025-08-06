import React, { useState } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const ManualEntryForm = () => {
  const { token } = useAuth();
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPosition = () => {
    setError("");
    // Basic validation
    if (!formData.symbol || !formData.quantity || !formData.unit_cost) {
      setError("Ticker Symbol, Quantity, and Unit Cost are required.");
      return;
    }
    if (
      isNaN(parseFloat(formData.quantity)) ||
      isNaN(parseFloat(formData.unit_cost))
    ) {
      setError("Quantity and Unit Cost must be valid numbers.");
      return;
    }

    const newPosition = {
      id: Date.now(), // Temporary ID for list key
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
    }); // Clear form
  };

  const handleRemovePosition = (id) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  const handleSavePortfolio = async () => {
    if (positions.length === 0) {
      setError("Add at least one position to save.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    // Prepare the data for the backend, removing the temporary 'id' field.
    const transactions_to_send = positions.map(({ id, ...rest }) => rest);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/portfolios/positions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactions: transactions_to_send }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save portfolio.");
      }

      setSuccess("Portfolio saved successfully!");
      setTimeout(() => {
        setPositions([]);
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 w-full max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold text-white mb-6">
        Add Positions Manually
      </h3>

      {/* Form Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

      {/* Positions Table */}
      <div className="mt-8">
        <h4 className="font-semibold text-white">
          Positions to Save ({positions.length})
        </h4>
        <div className="mt-4 overflow-hidden shadow ring-1 ring-slate-700 sm:rounded-lg">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white">
                  Symbol
                </th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
                  Quantity
                </th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
                  Unit Cost
                </th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
                  Total Value
                </th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {positions.length > 0 ? (
                positions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-white">
                      {p.symbol}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-300">
                      {p.quantity}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-300">
                      ${p.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-300">
                      ${(p.quantity * p.unit_cost).toFixed(2)}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <button
                        onClick={() => handleRemovePosition(p.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    Add a position to get started
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button & Messages */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-5 h-5 mr-2" />
              <p>{success}</p>
            </div>
          )}
        </div>
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
