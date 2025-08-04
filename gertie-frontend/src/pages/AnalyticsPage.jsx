import React from "react";
// Removed useState and useEffect as they are now handled inside the custom hook
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
// Import UI components and the new custom hook
import {
  MetricCard,
  ChartCard,
  Card,
  LoadingSpinner,
  ErrorMessage,
} from "../components/ui";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
// Import the service for direct calls
import { analyticsService } from "../services/api";

// Example function for calling a service directly from a user action
const runCustomAnalysis = async () => {
  try {
    console.log("Running FBM simulation...");
    const fbmResult = await analyticsService.runFBMSimulation({
      hurst: 0.8,
      num_paths: 50,
    });
    // In a real app, you might show a success notification here
    alert("FBM simulation successful! Check the console for results.");
    console.log("FBM simulation successful:", fbmResult);
  } catch (error) {
    console.error("FBM simulation failed:", error);
    // In a real app, you might show an error notification here
    alert("FBM simulation failed. Check the console for details.");
  }
};

export const AnalyticsPage = () => {
  // Use the hook to manage data fetching, loading, and error states
  const { data, loading, error, refetch } = useAnalyticsData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  // Render the page with data from the hook
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Hurst Exponent"
        value={data?.hurst?.hurst_exponent?.toFixed(2) || "N/A"}
        subValue={data?.hurst?.interpretation || "..."}
      />

      <Card className="md:col-span-2">
        <h3 className="text-slate-300 text-lg font-semibold">Market Regime</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-2xl font-bold text-white">
            {/* Display the name of the first detected regime as the current one */}
            {data?.regime?.regime_characteristics?.regime_0?.name || "N/A"}
          </span>
          <div className="flex space-x-2">
            {/* Map over the detected regimes to display them */}
            {Object.keys(data?.regime?.regime_characteristics || {}).map(
              (key, index) => (
                <span
                  key={key}
                  className={`px-2 py-1 text-xs rounded-full ${
                    index === 0 // Mocking the first regime as active for styling
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {data.regime.regime_characteristics[key].name}
                </span>
              )
            )}
          </div>
        </div>
      </Card>

      <ChartCard
        title="GARCH Volatility Forecast"
        className="md:col-span-2 lg:col-span-3"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            // Use the forecast_volatility array from the GARCH data
            data={data?.garch?.forecast_volatility || []}
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
              dataKey="vol" // Assuming the forecast data has a 'vol' key
              name="Volatility"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Added a card to trigger the custom analysis */}
      <Card className="md:col-span-1 lg:col-span-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-slate-300 text-lg font-semibold">
              Run Ad-Hoc Analysis
            </h3>
            <p className="text-slate-400 text-sm">
              Trigger a custom FBM simulation.
            </p>
          </div>
          <button
            onClick={runCustomAnalysis}
            className="bg-yellow-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Run Simulation
          </button>
        </div>
      </Card>
    </div>
  );
};
