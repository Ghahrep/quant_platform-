// src/services/api/client.ts
import { QueryClient } from '@tanstack/react-query';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.gertie.ai'  // Replace with your production URL
    : 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Base API Response Types
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  metadata: {
    request_id: string;
    computation_time_ms: number;
    cache_hit: boolean;
    api_version: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
  metadata: BaseResponse['metadata'];
}

// API Client Class
export class APIClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.headers = { ...API_CONFIG.headers };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken() {
    delete this.headers['Authorization'];
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BaseResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle HTTP errors
        const errorData: ErrorResponse = await response.json();
        throw new APIError(
          errorData.error.message,
          response.status,
          errorData.error.code,
          errorData.error.details
        );
      }

      const data: BaseResponse<T> = await response.json();
      return data;
      
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError('Network connection failed', 0, 'NETWORK_ERROR');
      }
      
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new APIError('Request timeout', 408, 'TIMEOUT_ERROR');
      }
      
      throw new APIError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<BaseResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<BaseResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<BaseResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<BaseResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.get<any>('/api/v1/health');
    return response.data;
  }
}

// Custom API Error class
export class APIError extends Error {
  public status: number;
  public code: string;
  public details: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'API_ERROR',
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Health check hook for React Query
export const useHealthCheck = () => {
  return {
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
    staleTime: 10000, // Consider fresh for 10 seconds
  };
};

// Connection status utility
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    await apiClient.healthCheck();
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

// Export types for other modules
export type { BaseResponse, ErrorResponse };