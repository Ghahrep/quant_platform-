// src/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { portfolioQueries } from '../services/api/portfolioApi';
import { useQueries } from '../services/queryClient';

// Custom hook to manage all dashboard data
export const useDashboardData = () => {
  // Portfolio summary query
  const portfolioSummaryQuery = useQuery(useQueries.portfolioSummary());
  
  // Risk metrics query
  const riskMetricsQuery = useQuery(useQueries.riskMetrics());
  
  // Asset allocation query
  const assetAllocationQuery = useQuery(useQueries.assetAllocation());
  
  // Holdings query (top 10)
  const holdingsQuery = useQuery(useQueries.holdings(10));
  
  // Market regime query
  const marketRegimeQuery = useQuery(useQueries.marketRegime());
  
  // Recent activity query (last 5)
  const activityQuery = useQuery(useQueries.recentActivity(5));
  
  // Risk alerts query (unacknowledged only)
  const alertsQuery = useQuery(useQueries.riskAlerts(false));

  // Aggregate loading and error states
  const isLoading = [
    portfolioSummaryQuery,
    riskMetricsQuery,
    assetAllocationQuery,
    holdingsQuery,
    marketRegimeQuery,
    activityQuery,
    alertsQuery
  ].some(query => query.isLoading);

  const isError = [
    portfolioSummaryQuery,
    riskMetricsQuery,
    assetAllocationQuery,
    holdingsQuery,
    marketRegimeQuery,
    activityQuery,
    alertsQuery
  ].some(query => query.isError);

  const error = [
    portfolioSummaryQuery,
    riskMetricsQuery,
    assetAllocationQuery,
    holdingsQuery,
    marketRegimeQuery,
    activityQuery,
    alertsQuery
  ].find(query => query.error)?.error;

  // Return all data and states
  return {
    // Data
    portfolioSummary: portfolioSummaryQuery.data,
    riskMetrics: riskMetricsQuery.data,
    assetAllocation: assetAllocationQuery.data,
    holdings: holdingsQuery.data,
    marketRegime: marketRegimeQuery.data,
    recentActivity: activityQuery.data,
    riskAlerts: alertsQuery.data,
    
    // States
    isLoading,
    isError,
    error,
    
    // Individual query states (for granular loading)
    queries: {
      portfolioSummary: portfolioSummaryQuery,
      riskMetrics: riskMetricsQuery,
      assetAllocation: assetAllocationQuery,
      holdings: holdingsQuery,
      marketRegime: marketRegimeQuery,
      activity: activityQuery,
      alerts: alertsQuery,
    },
    
    // Refetch functions
    refetch: () => {
      portfolioSummaryQuery.refetch();
      riskMetricsQuery.refetch();
      assetAllocationQuery.refetch();
      holdingsQuery.refetch();
      marketRegimeQuery.refetch();
      activityQuery.refetch();
      alertsQuery.refetch();
    },
    
    refetchCritical: () => {
      portfolioSummaryQuery.refetch();
      riskMetricsQuery.refetch();
      alertsQuery.refetch();
    }
  };
};

// Hook for just portfolio summary (lightweight)
export const usePortfolioSummary = () => {
  return useQuery(useQueries.portfolioSummary());
};

// Hook for risk metrics only
export const useRiskMetrics = () => {
  return useQuery(useQueries.riskMetrics());
};

// Hook for real-time alerts
export const useRiskAlerts = () => {
  return useQuery({
    ...useQueries.riskAlerts(false),
    refetchInterval: 10000, // Check every 10 seconds for alerts
  });
};