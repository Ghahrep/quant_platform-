// src/components/charts/PortfolioAllocationChart.jsx
import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import ChartContainer from "./ChartContainer";

// Use your existing color scheme - matching your theme
const ALLOCATION_COLORS = [
  "#FCD34D", // Yellow - matching your accent color
  "#60A5FA", // Blue
  "#34D399", // Green
  "#F87171", // Red
  "#A78BFA", // Purple
  "#FB7185", // Pink
  "#FBBF24", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue variant
  "#8B5CF6", // Violet
  "#F59E0B", // Orange
  "#EF4444", // Red variant
];

const PortfolioAllocationChart = ({
  portfolioData,
  isLoading = false,
  error = null,
  variant = "default", // Matches your component variants
}) => {
  // Process portfolio data - compatible with your existing data structure
  const chartData = useMemo(() => {
    if (!portfolioData || portfolioData.length === 0) {
      return [];
    }

    // Handle both current market value and cost basis
    const totalValue = portfolioData.reduce((sum, position) => {
      const value = position.market_value || position.total_cost_basis || 0;
      return sum + value;
    }, 0);

    // Transform data for Recharts
    return portfolioData
      .map((position, index) => {
        const value = position.market_value || position.total_cost_basis || 0;
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

        return {
          symbol: position.symbol,
          name: position.symbol,
          value: value,
          percentage: percentage,
          shares: position.total_quantity,
          color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
          currentPrice: position.current_price || null,
          avgCost: position.weighted_average_cost || 0,
          unrealizedPnL: position.unrealized_pnl || 0,
          // Calculate some additional metrics
          weight: percentage,
        };
      })
      .filter((item) => item.value > 0) // Filter out zero-value positions
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [portfolioData]);

  // Custom tooltip matching your app's design
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pnlColor =
        data.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400";

      return (
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <div className="mb-2">
            <p className="text-white font-bold text-lg">{data.symbol}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Market Value:</span>
              <span className="text-green-400 font-semibold">
                ${data.value.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-300">Allocation:</span>
              <span className="text-yellow-400 font-semibold">
                {data.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-300">Shares:</span>
              <span className="text-blue-400">
                {data.shares.toLocaleString()}
              </span>
            </div>

            {data.currentPrice && (
              <div className="flex justify-between">
                <span className="text-slate-300">Price:</span>
                <span className="text-slate-200">
                  ${data.currentPrice.toFixed(2)}
                </span>
              </div>
            )}

            {data.unrealizedPnL !== 0 && (
              <div className="flex justify-between border-t border-slate-700 pt-1 mt-2">
                <span className="text-slate-300">Unrealized P&L:</span>
                <span className={`font-semibold ${pnlColor}`}>
                  {data.unrealizedPnL >= 0 ? "+" : ""}$
                  {data.unrealizedPnL.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label function
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    if (percent < 0.05) return null; // Hide labels for slices < 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calculate summary stats
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const topHolding = chartData[0]; // Already sorted by value
  const diversificationScore =
    chartData.length > 1
      ? (1 - Math.max(...chartData.map((d) => d.percentage / 100))) * 100
      : 0;

  return (
    <ChartContainer
      title="Portfolio Allocation"
      subtitle={`$${totalValue.toLocaleString()} • ${chartData.length} positions • Diversification: ${diversificationScore.toFixed(0)}%`}
      isLoading={isLoading}
      error={error}
      height={variant === "compact" ? "350px" : "500px"}
      variant={variant}
    >
      {chartData.length > 0 ? (
        <div className="flex flex-col xl:flex-row items-center h-full gap-6">
          {/* Donut Chart */}
          <div className="flex-1 h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={variant === "compact" ? 100 : 130}
                  innerRadius={variant === "compact" ? 50 : 70}
                  dataKey="value"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings Legend */}
          <div className="xl:w-80 w-full">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Holdings Breakdown
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {chartData.map((item, index) => {
                  const pnlColor =
                    item.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400";

                  return (
                    <div
                      key={item.symbol}
                      className="flex items-center justify-between hover:bg-slate-700/30 rounded p-2 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-slate-600"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <span className="text-white font-medium text-sm">
                            {item.symbol}
                          </span>
                          <div className="text-slate-400 text-xs">
                            {item.shares.toLocaleString()} shares
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">
                          {item.percentage.toFixed(1)}%
                        </div>
                        <div className="text-slate-300 text-xs">
                          ${item.value.toLocaleString()}
                        </div>
                        {item.unrealizedPnL !== 0 && (
                          <div className={`text-xs ${pnlColor}`}>
                            {item.unrealizedPnL >= 0 ? "+" : ""}$
                            {Math.abs(item.unrealizedPnL).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Top Holding:</span>
                    <div className="text-white font-semibold">
                      {topHolding?.symbol} ({topHolding?.percentage.toFixed(1)}
                      %)
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Positions:</span>
                    <div className="text-white font-semibold">
                      {chartData.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl mb-2">No Portfolio Data</p>
            <p className="text-sm">
              Add positions to see your allocation breakdown
            </p>
          </div>
        </div>
      )}
    </ChartContainer>
  );
};

export default PortfolioAllocationChart;
