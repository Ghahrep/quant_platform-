import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MetricCard, ChartCard, Card } from "../components/ui";
import { hurstData, regimeData, garchForecastData } from "../data";

export const AnalyticsPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Hurst Exponent"
        value={hurstData.hurst_exponent.toFixed(2)}
        subValue={hurstData.interpretation}
      />

      <Card className="md:col-span-2">
        <h3 className="text-slate-300 text-lg font-semibold">Market Regime</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-2xl font-bold text-white">
            {regimeData.current_regime}
          </span>
          <div className="flex space-x-2">
            {regimeData.regimes.map((r) => (
              <span
                key={r}
                className={`px-2 py-1 text-xs rounded-full ${
                  regimeData.current_regime.includes(r)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <ChartCard
        title="GARCH Volatility Forecast"
        className="md:col-span-2 lg:col-span-3"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={garchForecastData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(tick) => `${(tick * 100).toFixed(1)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
              }}
              formatter={(value) => `${(value * 100).toFixed(2)}%`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="vol"
              name="Volatility"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
