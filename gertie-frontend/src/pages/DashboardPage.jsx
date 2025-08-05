import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Bell } from "lucide-react";
import {
  MetricCard,
  ChartCard,
  Card,
  LoadingSpinner,
  ErrorMessage,
} from "../components/ui";
import { useRiskMetrics } from "../hooks/useRiskMetrics";
import { portfolioService } from "../services/api";

// Mock data is kept as a fallback in case the API fails
import {
  riskLevelData,
  riskAssessmentData,
  portfolioPerformanceData,
  alertsData,
  holdingsData,
  highAlert,
} from "../data";

const RiskAssessmentGrid = () => {
  // This component can remain as is if its data is static for now
  const getColor = (level) => {
    switch (level) {
      case 0:
        return "bg-green-500/50";
      case 1:
        return "bg-yellow-500/50";
      case 2:
        return "bg-orange-500/50";
      case 3:
        return "bg-red-500/50";
      default:
        return "bg-slate-700";
    }
  };
  return (
    <Card>
      <h3 className="text-slate-300 text-lg font-semibold mb-4">
        Risk Assessment
      </h3>
      <div className="grid grid-cols-10 gap-1.5">
        {riskAssessmentData.map((item) => (
          <div
            key={item.id}
            className={`h-4 rounded ${getColor(item.level)}`}
          ></div>
        ))}
      </div>
    </Card>
  );
};

const HoldingsTable = () => {
  // This component can also remain as is for now
  return (
    <Card className="col-span-1 lg:col-span-2">
      <h3 className="text-slate-300 text-lg font-semibold mb-4">Holdings</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2 text-right">Value</th>
              <th className="py-2 px-2 text-right">Risk</th>
              <th className="py-2 px-2 text-right">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {holdingsData.map((holding) => (
              <tr
                key={holding.name}
                className="border-b border-slate-800 text-slate-200"
              >
                <td className="py-3 px-2 font-medium">{holding.name}</td>
                <td className="py-3 px-2 text-right">
                  ${holding.value.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right">
                  {holding.risk.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right">
                  {(holding.allocation * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const DashboardPage = () => {
  // 1. Call the custom hook to get data, loading, and error states
  const { data: riskData, loading, error, refetch } = useRiskMetrics();

  // This function demonstrates how to call a service directly, for example, from a button click
  const handleRefreshPortfolio = async () => {
    try {
      console.log("Refreshing portfolio data...");
      // In a real app, you might want to show a loading indicator here
      const overview = await portfolioService.getOverview("port_123");
      console.log("Portfolio overview refreshed:", overview);
      // Call the hook's refetch function to update the risk metrics as well
      refetch();
    } catch (error) {
      console.error("Failed to refresh portfolio:", error);
    }
  };

  // 2. Handle loading and error states for a better user experience
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" text="Loading Risk Metrics..." />
      </div>
    );
  }

  // 3. If data has loaded, render the component with the fetched data
  return (
    <>
      {/* Show an error message if the API call failed */}
      {error && (
        <div className="mb-6">
          <ErrorMessage
            error={`Risk API Error: ${error}. Displaying fallback data.`}
            onRetry={refetch}
          />
        </div>
      )}

      <div className="lg:hidden">
        {/* This data would come from a different hook, e.g., usePortfolioOverview */}
        <MetricCard title="Total Value" value="$52,800.75" change={-0.004} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 4. Replace static mock data with data from our hook */}
        <MetricCard
          title="Overall Risk"
          value="Moderate"
          subValue={riskData?.overallRiskScore?.toFixed(1) || "N/A"}
        />
        <MetricCard
          title="Value at Risk"
          value={`$${(riskData?.valueAtRisk || 0).toLocaleString()}`}
          subValue="95% Confidence"
        />
        {/* Add CVaR metric if available */}
        {riskData?.cvar && (
          <MetricCard
            title="Expected Shortfall"
            value={`$${(Math.abs(riskData.cvar.cvar_estimate) || 0).toLocaleString()}`}
            subValue={`${(riskData.cvar.confidence_level * 100).toFixed(0)}% CVaR`}
          />
        )}
        {/* Add Stress Test metric if available */}
        {riskData?.stressTest && (
          <MetricCard
            title="Stress Test Loss"
            value={`-$${(Math.abs(riskData.stressTest.scenario_results[0].portfolio_loss) || 0).toLocaleString()}`}
            subValue="2008 Crash Scenario"
          />
        )}

        {/* The rest of the components can use mock data for now */}
        <ChartCard title="Risk Level" className="md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={riskLevelData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="level"
                stroke="#facc15"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Portfolio Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={portfolioPerformanceData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="performance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <RiskAssessmentGrid />

        <Card className="flex flex-col">
          <h3 className="text-slate-300 text-lg font-semibold mb-2">Alerts</h3>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-yellow-400 mt-1" />
              <div>
                <h4 className="font-bold text-yellow-400">{highAlert.title}</h4>
                <p className="text-sm text-slate-300">
                  {highAlert.description}
                </p>
                <p className="text-xs text-slate-400 mt-1">{highAlert.time}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={alertsData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="alerts">
                  {alertsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.alerts > 3 ? "#facc15" : "#3b82f6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <HoldingsTable />
      </div>
    </>
  );
};
