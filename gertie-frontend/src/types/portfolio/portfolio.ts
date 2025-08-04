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