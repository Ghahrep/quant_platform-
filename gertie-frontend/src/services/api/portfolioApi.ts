// src/services/api/portfolioApi.ts
import { apiClient, BaseResponse } from './client';

// Portfolio Data Types (matching your FastAPI backend)
export interface PortfolioSummary {
  total_value: number;
  daily_change: number;
  daily_change_percent: number;
  cash_balance: number;
  invested_amount: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_return_percent: number;
  last_updated: string;
}

export interface RiskMetrics {
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  sharpe_ratio: number;
  beta: number;
  alpha: number;
  max_drawdown: number;
  volatility: number;
  information_ratio: number;
  sortino_ratio: number;
  last_calculated: string;
}

export interface AssetAllocation {
  asset_class: string;
  allocation_percent: number;
  market_value: number;
  target_percent?: number;
  deviation_percent?: number;
}

export interface Holding {
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  market_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  weight_percent: number;
  sector?: string;
  beta?: number;
  last_updated: string;
}

export interface MarketRegime {
  current_regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  confidence: number;
  regime_start_date: string;
  indicators: {
    trend_strength: number;
    volatility_level: number;
    momentum: number;
    mean_reversion: number;
  };
  last_updated: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'REBALANCE' | 'ALERT';
  description: string;
  symbol?: string;
  amount?: number;
  quantity?: number;
  price?: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface RiskAlert {
  id: string;
  type: 'VAR_THRESHOLD' | 'CONCENTRATION' | 'CORRELATION' | 'DRAWDOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  triggered_at: string;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

// Portfolio API Class
export class PortfolioAPI {
  // Get portfolio summary
  async getSummary(): Promise<PortfolioSummary> {
    const response = await apiClient.get<PortfolioSummary>('/api/v1/portfolio/summary');
    return response.data!;
  }

  // Get risk metrics
  async getRiskMetrics(): Promise<RiskMetrics> {
    const response = await apiClient.get<RiskMetrics>('/api/v1/portfolio/risk-metrics');
    return response.data!;
  }

  // Get asset allocation
  async getAssetAllocation(): Promise<AssetAllocation[]> {
    const response = await apiClient.get<AssetAllocation[]>('/api/v1/portfolio/allocation');
    return response.data!;
  }

  // Get holdings
  async getHoldings(limit?: number): Promise<Holding[]> {
    const response = await apiClient.get<Holding[]>('/api/v1/portfolio/holdings', {
      limit: limit || 10
    });
    return response.data!;
  }

  // Get market regime
  async getMarketRegime(): Promise<MarketRegime> {
    const response = await apiClient.get<MarketRegime>('/api/v1/market/regime');
    return response.data!;
  }

  // Get recent activity
  async getActivity(limit?: number): Promise<ActivityItem[]> {
    const response = await apiClient.get<ActivityItem[]>('/api/v1/portfolio/activity', {
      limit: limit || 5
    });
    return response.data!;
  }

  // Get risk alerts
  async getRiskAlerts(acknowledged?: boolean): Promise<RiskAlert[]> {
    const response = await apiClient.get<RiskAlert[]>('/api/v1/portfolio/alerts', {
      acknowledged: acknowledged ?? false
    });
    return response.data!;
  }

  // Acknowledge risk alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    await apiClient.post(`/api/v1/portfolio/alerts/${alertId}/acknowledge`);
  }

  // Trigger portfolio rebalance
  async triggerRebalance(): Promise<{ task_id: string }> {
    const response = await apiClient.post<{ task_id: string }>('/api/v1/portfolio/rebalance');
    return response.data!;
  }

  // Get rebalance status
  async getRebalanceStatus(taskId: string): Promise<{
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    progress: number;
    message?: string;
  }> {
    const response = await apiClient.get(`/api/v1/portfolio/rebalance/${taskId}/status`);
    return response.data!;
  }
}

// Create singleton instance
export const portfolioApi = new PortfolioAPI();

// React Query hooks for portfolio data
export const portfolioQueries = {
  // Portfolio summary
  summary: () => ({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => portfolioApi.getSummary(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  }),

  // Risk metrics
  riskMetrics: () => ({
    queryKey: ['portfolio', 'risk-metrics'],
    queryFn: () => portfolioApi.getRiskMetrics(),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  }),

  // Asset allocation
  allocation: () => ({
    queryKey: ['portfolio', 'allocation'],
    queryFn: () => portfolioApi.getAssetAllocation(),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  }),

  // Holdings
  holdings: (limit?: number) => ({
    queryKey: ['portfolio', 'holdings', limit],
    queryFn: () => portfolioApi.getHoldings(limit),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  }),

  // Market regime
  marketRegime: () => ({
    queryKey: ['market', 'regime'],
    queryFn: () => portfolioApi.getMarketRegime(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  }),

  // Activity
  activity: (limit?: number) => ({
    queryKey: ['portfolio', 'activity', limit],
    queryFn: () => portfolioApi.getActivity(limit),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  }),

  // Risk alerts
  alerts: (acknowledged?: boolean) => ({
    queryKey: ['portfolio', 'alerts', acknowledged],
    queryFn: () => portfolioApi.getRiskAlerts(acknowledged),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  }),
};

// Utility functions for data transformation
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const getRiskColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string => {
  switch (level) {
    case 'LOW': return 'text-green-600';
    case 'MEDIUM': return 'text-yellow-600';
    case 'HIGH': return 'text-orange-600';
    case 'CRITICAL': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getChangeColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};