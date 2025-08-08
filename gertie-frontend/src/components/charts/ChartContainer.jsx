// src/components/charts/ChartContainer.jsx
import React from "react";
import { Loader2, AlertCircle, TrendingUp } from "lucide-react";

const ChartContainer = ({
  title,
  subtitle,
  children,
  isLoading = false,
  error = null,
  className = "",
  height = "400px",
  showIcon = true,
  // Add compatibility with your existing styling
  variant = "default", // "default", "compact", "dashboard"
}) => {
  // Adapt to your existing theme classes
  const containerClasses = {
    default: "bg-slate-800/50 border border-slate-700 rounded-lg p-6",
    compact: "bg-slate-800/50 border border-slate-700 rounded-lg p-4",
    dashboard: "bg-slate-900 border border-slate-600 rounded-xl p-6 shadow-lg",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {/* Chart Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showIcon && <TrendingUp className="w-5 h-5 text-yellow-500" />}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          {/* Optional header actions slot */}
          <div className="flex items-center space-x-2">
            {/* This space can be used for chart controls */}
          </div>
        </div>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {/* Chart Content */}
      <div style={{ height }} className="relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20 rounded">
            <div className="flex items-center space-x-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/10 rounded">
            <div className="flex flex-col items-center space-y-2 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <span className="text-center text-sm">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-slate-500 hover:text-slate-400 underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
