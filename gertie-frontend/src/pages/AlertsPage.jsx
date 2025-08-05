import React, { useState, useEffect, useMemo } from "react";
import { Bell, X } from "lucide-react";
// Import UI components and the necessary custom hooks
import {
  MetricCard,
  Card,
  LoadingSpinner,
  ErrorMessage,
} from "../components/ui";
import { useAlertsData } from "../hooks/useAlertsData";
import { useWebSocket } from "../hooks/useWebSocket";
import { WEBSOCKET_ENDPOINTS } from "../services/api";

// Helper function to format the timestamp
const formatTimeAgo = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

export const AlertsPage = () => {
  // This hook fetches the initial list of alerts when the page loads
  const { data: initialAlerts, loading, error, refetch } = useAlertsData();

  // This new hook listens for LIVE updates from the WebSocket
  const { data: newAlert, connectionStatus } = useWebSocket(
    WEBSOCKET_ENDPOINTS.RISK_ALERTS
  );

  // This state will hold the combined list of alerts (initial + live)
  const [alerts, setAlerts] = useState([]);

  // This effect runs once to set the initial list of alerts from the API
  useEffect(() => {
    if (initialAlerts) {
      setAlerts(initialAlerts);
    }
  }, [initialAlerts]);

  // This effect runs every time a NEW alert arrives from the WebSocket
  useEffect(() => {
    if (newAlert) {
      // Add the new alert to the top of the list, ensuring no duplicates
      setAlerts((prevAlerts) => {
        if (prevAlerts.find((a) => a.id === newAlert.id)) {
          return prevAlerts; // Alert already exists, do nothing
        }
        return [newAlert, ...prevAlerts];
      });
    }
  }, [newAlert]);

  // Calculate summary metrics dynamically from the combined alerts list
  const summaryMetrics = useMemo(() => {
    if (!alerts) return { critical: 0, warnings: 0, total: 0 };
    return {
      critical: alerts.filter((a) => a.severity === "critical").length,
      warnings: alerts.filter((a) => a.severity === "warning").length,
      total: alerts.length,
    };
  }, [alerts]);

  // Helper functions for styling
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

  const handleDismiss = (alertId) => {
    console.log(`Dismissing alert: ${alertId}`);
    setAlerts((prevAlerts) => prevAlerts.filter((a) => a.id !== alertId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" text="Loading Alerts..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Real-time Status:</span>
          <span
            className={`capitalize font-semibold ${connectionStatus === "connected" ? "text-green-400" : "text-yellow-400"}`}
          >
            {connectionStatus}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Critical Alerts"
          value={summaryMetrics.critical}
          subValue="Requires immediate attention"
        />
        <MetricCard
          title="Warnings"
          value={summaryMetrics.warnings}
          subValue="Monitor closely"
        />
        <MetricCard
          title="Total Alerts"
          value={summaryMetrics.total}
          subValue="Live Feed"
        />
      </div>

      <Card>
        <h3 className="text-slate-300 text-lg font-semibold mb-4">
          Recent Alerts
        </h3>
        <div className="space-y-4">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 animate-fade-in ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <Bell
                    className={`w-5 h-5 mt-1 flex-shrink-0 ${getSeverityIcon(alert.severity)}`}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-200">{alert.title}</h4>
                    <p className="text-sm text-slate-300 mt-1">
                      {alert.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">No recent alerts.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
