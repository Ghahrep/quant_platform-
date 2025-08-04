// src/services/api/analyticsApi.ts
import { apiClient, BaseResponse } from './client';

// Analytics Data Types
export interface FractalAnalysisRequest {
  symbol: string;
  period: string; // '3M', '6M', '1Y', '2Y', '5Y'
  method: 'DFA' | 'RS_ANALYSIS' | 'MULTIFRACTAL_DFA';
}

export interface FractalAnalysisResult {
  symbol: string;
  hurst_exponent: number;
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
  interpretation: {
    regime: 'ANTI_PERSISTENT' | 'RANDOM_WALK' | 'PERSISTENT';
    description: string;
    market_behavior: string[];
  };
  multifractal_spectrum?: {
    alpha_min: number;
    alpha_max: number;
    f_alpha: number[];
    alpha: number[];
  };
  calculation_time_ms: number;
  last_calculated: string;
}

export interface GarchAnalysisRequest {
  symbol: string;
  model_type: 'GARCH' | 'EGARCH' | 'GJR_GARCH';
  forecast_horizon: number; // 5-60 days
  confidence_level: number; // 0.80-0.99
}

export interface GarchAnalysisResult {
  symbol: string;
  model_type: string;
  parameters: {
    omega: number;
    alpha: number;
    beta: number;
    gamma?: number; // For GJR-GARCH
  };
  volatility_forecast: {
    dates: string[];
    values: number[];
    confidence_bands: {
      upper: number[];
      lower: number[];
    };
  };
  model_fit: {
    aic: number;
    bic: number;
    log_likelihood: number;
    residual_diagnostics: {
      ljung_box_p_value: number;
      arch_lm_p_value: number;
    };
  };
  calculation_time_ms: number;
  last_calculated: string;
}

export interface CvarAnalysisRequest {
  portfolio_value: number;
  time_horizon: number; // days
  confidence_levels: number[]; // [0.90, 0.95, 0.99, 0.999]
  simulation_method: 'MONTE_CARLO' | 'HISTORICAL' | 'PARAMETRIC';
}

export interface CvarAnalysisResult {
  portfolio_value: number;
  time_horizon: number;
  results: {
    confidence_level: number;
    var: number;
    cvar: number;
    expected_shortfall: number;
    portfolio_impact_percent: number;
  }[];
  loss_distribution: {
    returns: number[];
    probabilities: number[];
    percentiles: {
      p95: number;
      p99: number;
      p999: number;
    };
  };
  stress_tests: {
    scenario: 'MARKET_CRASH' | 'SECTOR_SHOCK' | 'LIQUIDITY_CRISIS';
    description: string;
    potential_loss: number;
    probability: number;
  }[];
  calculation_time_ms: number;
  last_calculated: string;
}

// Analytics API Class
export class AnalyticsAPI {
  // Fractal Analysis
  async runFractalAnalysis(request: FractalAnalysisRequest): Promise<FractalAnalysisResult> {
    const response = await apiClient.post<FractalAnalysisResult>('/api/v1/analytics/fractal', request);
    return response.data!;
  }

  // Get cached fractal analysis
  async getFractalAnalysis(symbol: string): Promise<FractalAnalysisResult | null> {
    try {
      const response = await apiClient.get<FractalAnalysisResult>(`/api/v1/analytics/fractal/${symbol}`);
      return response.data!;
    } catch (error) {
      return null; // No cached result
    }
  }

  // GARCH Analysis
  async runGarchAnalysis(request: GarchAnalysisRequest): Promise<GarchAnalysisResult> {
    const response = await apiClient.post<GarchAnalysisResult>('/api/v1/analytics/garch', request);
    return response.data!;
  }

  // Get cached GARCH analysis
  async getGarchAnalysis(symbol: string): Promise<GarchAnalysisResult | null> {
    try {
      const response = await apiClient.get<GarchAnalysisResult>(`/api/v1/analytics/garch/${symbol}`);
      return response.data!;
    } catch (error) {
      return null;
    }
  }

  // CVaR Analysis
  async runCvarAnalysis(request: CvarAnalysisRequest): Promise<CvarAnalysisResult> {
    const response = await apiClient.post<CvarAnalysisResult>('/api/v1/analytics/cvar', request);
    return response.data!;
  }

  // Get cached CVaR analysis
  async getCvarAnalysis(): Promise<CvarAnalysisResult | null> {
    try {
      const response = await apiClient.get<CvarAnalysisResult>('/api/v1/analytics/cvar');
      return response.data!;
    } catch (error) {
      return null;
    }
  }

  // Get available symbols for analysis
  async getAvailableSymbols(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/api/v1/analytics/symbols');
    return response.data!;
  }

  // Get analysis history
  async getAnalysisHistory(type: 'fractal' | 'garch' | 'cvar', limit: number = 10): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/api/v1/analytics/history/${type}`, { limit });
    return response.data!;
  }
}

// Create singleton instance
export const analyticsApi = new AnalyticsAPI();

// React Query hooks for analytics
export const analyticsQueries = {
  // Fractal analysis
  fractalAnalysis: (symbol: string) => ({
    queryKey: ['analytics', 'fractal', symbol],
    queryFn: () => analyticsApi.getFractalAnalysis(symbol),
    staleTime: 300000, // 5 minutes
    enabled: !!symbol,
  }),

  // GARCH analysis
  garchAnalysis: (symbol: string) => ({
    queryKey: ['analytics', 'garch', symbol],
    queryFn: () => analyticsApi.getGarchAnalysis(symbol),
    staleTime: 300000, // 5 minutes
    enabled: !!symbol,
  }),

  // CVaR analysis
  cvarAnalysis: () => ({
    queryKey: ['analytics', 'cvar'],
    queryFn: () => analyticsApi.getCvarAnalysis(),
    staleTime: 300000, // 5 minutes
  }),

  // Available symbols
  availableSymbols: () => ({
    queryKey: ['analytics', 'symbols'],
    queryFn: () => analyticsApi.getAvailableSymbols(),
    staleTime: 3600000, // 1 hour
  }),

  // Analysis history
  analysisHistory: (type: 'fractal' | 'garch' | 'cvar', limit: number = 10) => ({
    queryKey: ['analytics', 'history', type, limit],
    queryFn: () => analyticsApi.getAnalysisHistory(type, limit),
    staleTime: 60000, // 1 minute
  }),
};

// Mutation hooks for running new analyses
interface AnalyticsMutations {
  runFractalAnalysis: (request: FractalAnalysisRequest) => Promise<FractalAnalysisResult>;
  runGarchAnalysis: (request: GarchAnalysisRequest) => Promise<GarchAnalysisResult>;
  runCvarAnalysis: (request: CvarAnalysisRequest) => Promise<CvarAnalysisResult>;
}

export const analyticsMutations: AnalyticsMutations = {
  runFractalAnalysis: (request: FractalAnalysisRequest) => 
    analyticsApi.runFractalAnalysis(request),
  
  runGarchAnalysis: (request: GarchAnalysisRequest) => 
    analyticsApi.runGarchAnalysis(request),
  
  runCvarAnalysis: (request: CvarAnalysisRequest) => 
    analyticsApi.runCvarAnalysis(request),
};

// Utility functions
export const getHurstInterpretation = (hurst: number) => {
  if (hurst < 0.5) {
    return {
      regime: 'Anti-persistent',
      color: 'text-red-600',
      description: 'Mean-reverting behavior with frequent direction changes',
      characteristics: [
        'Trends tend to reverse quickly',
        'High volatility with oscillations',
        'Market corrections and mean reversion'
      ]
    };
  } else if (hurst > 0.5) {
    return {
      regime: 'Persistent',
      color: 'text-green-600',
      description: 'Trending behavior with momentum effects',
      characteristics: [
        'Strong trends that persist over time',
        'Momentum effects and long memory',
        'Trending markets and bubble formation'
      ]
    };
  } else {
    return {
      regime: 'Random Walk',
      color: 'text-blue-600',
      description: 'Standard Brownian motion with no predictable patterns',
      characteristics: [
        'No predictable patterns',
        'Efficient market hypothesis',
        'Geometric Brownian motion'
      ]
    };
  }
};

export const formatVolatility = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
};