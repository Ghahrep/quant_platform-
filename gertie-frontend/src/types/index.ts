// src/types/index.ts - Core TypeScript types for Gertie.ai

// API Response Base Types
export interface BaseResponse {
  success: boolean;
  metadata: {
    request_id: string;
    computation_time_ms: number;
    cache_hit: boolean;
    api_version: string;
    timestamp: string;
  };
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Analysis Types
export interface HurstExponentResponse extends BaseResponse {
  hurst_exponent: number;
  interpretation: 'mean-reverting' | 'persistent' | 'random_walk';
}

export interface GARCHResponse extends BaseResponse {
  data: {
    in_sample_volatility: number[];
    forecast_volatility: number[];
  };
}

export interface CVarResponse extends BaseResponse {
  data: {
    cvar_estimate: number;
    confidence_level: number;
  };
}

export interface RegimeDetectionResponse extends BaseResponse {
  data: {
    regime_labels: number[];
    regime_characteristics: Record<string, {
      mean_return: number;
      volatility: number;
    }>;
    transition_matrix: number[][];
  };
}

export interface FbmSimulationResponse extends BaseResponse {
  data: {
    num_paths: number;
    simulation_days: number;
    summary_statistics: {
      mean_final_value: number;
      median_final_value: number;
      std_final_value: number;
    };
    paths: number[][];
  };
}

// Portfolio Types
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  total_value: number;
  daily_change: number;
  daily_change_percent: number;
  risk_level: 'Low' | 'Medium' | 'High';
  var_95: number;
  sharpe_ratio: number;
  beta: number;
  created_at: string;
  updated_at: string;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  current_price: number;
  market_value: number;
  weight: number;
  day_change: number;
  day_change_percent: number;
  risk_level: 'Low' | 'Medium' | 'High';
  sector: string;
}

export interface RiskMetrics {
  var_95: number;
  expected_shortfall: number;
  volatility: number;
  beta: number;
  sharpe_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface PortfolioChartData {
  date: string;
  portfolio_value: number;
  benchmark_value: number;
  drawdown?: number;
}

// Market Regime Types
export interface MarketRegime {
  regime_id: number;
  name: string;
  probability: number;
  characteristics: {
    volatility: 'Low' | 'Medium' | 'High';
    trend: 'Bull' | 'Bear' | 'Sideways';
    duration_days: number;
  };
}

// Fractal Analysis Types
export interface FractalAnalysis {
  hurst_exponent: number;
  dfa_alpha: number;
  multifractal_width: number;
  interpretation: {
    persistence: 'Anti-persistent' | 'Random Walk' | 'Persistent';
    complexity: 'Low' | 'Moderate' | 'High';
    trading_implication: string;
  };
}

// Efficient Frontier Types
export interface EfficientFrontierPoint {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  weights: Record<string, number>;
}

export interface OptimizationResult {
  optimal_weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  objective: string;
}

// Chat System Types
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  insight?: ChatInsight;
  quickActions?: QuickAction[];
}

export interface ChatInsight {
  title: string;
  description: string;
  action: string;
  data?: Record<string, any>;
}

export interface QuickAction {
  label: string;
  action: string;
  agent?: string;
  icon?: string;
}

export interface PortfolioContext {
  totalValue?: string;
  dailyChange?: string;
  riskLevel?: string;
  var95?: string;
  sharpeRatio?: string;
  activeAlerts?: number;
  policyViolations?: number;
  topHoldings?: string[];
}

// AI Assistant Types
export interface AIAssistantResponse extends BaseResponse {
  data: {
    response_id: string;
    message: string;
    analysis_performed: Array<{
      type: string;
      results: Record<string, any>;
    }>;
    recommendations: Array<{
      action: string;
      rationale: string;
      suggested_change: Record<string, any>;
      confidence: number;
      time_horizon: string;
    }>;
    supporting_charts: Array<{
      type: string;
      url: string;
    }>;
    suggested_follow_ups: string[];
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'portfolio_update' | 'market_data' | 'alert' | 'regime_change';
  data: any;
  timestamp: string;
}

export interface PortfolioUpdate {
  portfolio_id: string;
  total_value: number;
  daily_return: number;
  var_95: number;
  current_positions: Record<string, {
    value: number;
    weight: number;
  }>;
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  refreshing: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Form Types
export interface CreatePortfolioForm {
  name: string;
  description?: string;
  initial_value: number;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  benchmark?: string;
}

export interface OptimizationForm {
  assets: string[];
  objective: 'minimize_cvar' | 'maximize_sharpe' | 'minimize_variance' | 'maximize_return';
  constraints: {
    min_weight: number;
    max_weight: number;
    long_only: boolean;
    fully_invested: boolean;
  };
}

// Simulation Types
export interface SimulationConfig {
  initial_price: number;
  hurst: number;
  days: number;
  volatility: number;
  drift: number;
  num_paths: number;
}

// Health Check Types
export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  database: string;
  cache: string;
  services: {
    analysis_engine: string;
    market_data: string;
    notification_service: string;
  };
}

// Export all types
export * from './api/api';
export * from './portfolio/portfolio';
export * from './chat/chat';