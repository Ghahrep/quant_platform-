import React from "react";
import { Bell, X } from "lucide-react";
import { MetricCard, Card } from "../components/ui";
import { alertsList } from "../data";

export const AlertsPage = () => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/10";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/10";
      case "info":
        return "border-blue-500/30 bg-blue-500/10";
      default:
        return "border-slate-500/30 bg-slate-500/10";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Critical Alerts"
          value="1"
          subValue="Requires attention"
        />
        <MetricCard title="Warnings" value="2" subValue="Monitor closely" />
        <MetricCard title="Total Alerts" value="8" subValue="Last 30 days" />
      </div>

      <Card>
        <h3 className="text-slate-300 text-lg font-semibold mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-4">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <Bell
                  className={`w-5 h-5 mt-1 ${getSeverityIcon(alert.severity)}`}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200">{alert.title}</h4>
                  <p className="text-sm text-slate-300 mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">{alert.time}</p>
                </div>
                <button className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
