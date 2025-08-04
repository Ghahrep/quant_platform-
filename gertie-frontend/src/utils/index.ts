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

export interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  daily_change: number;
  daily_change_percent: number;
  risk_level: 'Low' | 'Medium' | 'High';
  var_95: number;
}

export interface Position {
  symbol: string;
  name: string;
  value: number;
  weight: number;
  day_change: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}