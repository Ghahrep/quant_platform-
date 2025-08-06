import React from "react";
import { Trash2 } from "lucide-react";

const PortfolioTable = ({ portfolio, onDelete }) => {
  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-800/50 border border-slate-700 rounded-lg">
        <p className="text-slate-400">Your portfolio is empty.</p>
        <p className="text-sm text-slate-500 mt-2">
          Upload a CSV or add positions manually to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-slate-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white">
              Symbol
            </th>
            <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
              Total Quantity
            </th>
            <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
              W. Avg Cost
            </th>
            <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
              Total Cost Basis
            </th>
            <th className="py-3.5 px-3 text-left text-sm font-semibold text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
          {portfolio.map((pos) => (
            <tr key={pos.symbol}>
              <td className="py-4 pl-4 pr-3 text-sm font-medium text-white">
                {pos.symbol}
              </td>
              <td className="px-3 py-4 text-sm text-slate-300">
                {pos.total_quantity}
              </td>
              <td className="px-3 py-4 text-sm text-slate-300">
                ${pos.weighted_average_cost.toFixed(2)}
              </td>
              <td className="px-3 py-4 text-sm text-slate-300">
                ${pos.total_cost_basis.toFixed(2)}
              </td>
              <td className="px-3 py-4 text-sm">
                {/* 1. CONNECT ONCLICK TO THE ONDELETE PROP */}
                <button
                  onClick={() => onDelete(pos.symbol)}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                  title={`Delete ${pos.symbol}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
