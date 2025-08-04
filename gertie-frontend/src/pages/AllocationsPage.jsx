import React, { useState } from "react";
import { PieChart, Pie, Sector, ResponsiveContainer, Cell } from "recharts";
import { ChartCard, Card } from "../components/ui";
import {
  allocationByCategoryData,
  optimizationSuggestions,
  CHART_COLORS,
} from "../data";

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
            {optimizationSuggestions.rationale}
          </p>
          <div>
            <h4 className="font-semibold text-slate-400 mb-2">
              Expected Improvement:
            </h4>
            <div className="flex space-x-4">
              <span className="text-green-400">
                Risk Reduction:{" "}
                {(
                  optimizationSuggestions.expected_improvement.risk_reduction *
                  100
                ).toFixed(1)}
                %
              </span>
              <span className="text-red-400">
                Return Change:{" "}
                {(
                  optimizationSuggestions.expected_improvement
                    .expected_return_change * 100
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
