import React, { useState } from "react";
import { PieChart, Pie, Sector, ResponsiveContainer, Cell } from "recharts";
// Import UI components and the new custom hook
import {
  ChartCard,
  Card,
  LoadingSpinner,
  ErrorMessage,
} from "../components/ui";
import { useAllocationsData } from "../hooks/useAllocationsData";
// CHART_COLORS would typically be defined in a constants file
const CHART_COLORS = ["#3b82f6", "#facc15", "#10b981", "#f97316", "#8b5cf6"];

const ActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy - 10}
        dy={8}
        textAnchor="middle"
        fill={fill}
        className="text-lg font-bold"
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 10}
        dy={8}
        textAnchor="middle"
        fill="#9ca3af"
      >{`(${(percent * 100).toFixed(2)}%)`}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const AllocationsPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_, index) => setActiveIndex(index);

  // 1. Call the custom hook to get data, loading, and error states
  const { data, loading, error, refetch } = useAllocationsData();

  // 2. Handle loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" text="Loading Allocation Data..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  // 3. Use the data from the hook
  const allocationByCategoryData = data?.byCategory || [];
  const optimizationSuggestions = data?.optimizationSuggestion || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Allocation by Category" className="lg:h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={ActiveShape}
              data={allocationByCategoryData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {allocationByCategoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="lg:h-[450px]">
        <h3 className="text-slate-300 text-lg font-semibold mb-4">
          Optimization Suggestion
        </h3>
        <div className="space-y-4 text-slate-300">
          <p className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            {optimizationSuggestions.rationale || "No suggestion available."}
          </p>
          <div>
            <h4 className="font-semibold text-slate-400 mb-2">
              Expected Improvement:
            </h4>
            <div className="flex space-x-4">
              <span className="text-green-400">
                Risk Reduction:{" "}
                {(
                  (optimizationSuggestions.expected_improvement
                    ?.risk_reduction || 0) * 100
                ).toFixed(1)}
                %
              </span>
              <span className="text-red-400">
                Return Change:{" "}
                {(
                  (optimizationSuggestions.expected_improvement
                    ?.expected_return_change || 0) * 100
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
          <button className="w-full bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors">
            Preview & Rebalance
          </button>
        </div>
      </Card>
    </div>
  );
};
