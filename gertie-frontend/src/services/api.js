// src/services/api.js - Updated to match your FastAPI backend

// API Configuration using your existing Vite env setup
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === "true";

// API Endpoints matching your FastAPI routes
export const API_ENDPOINTS = {
  // Health check
  HEALTH: "/api/v1/health",

  // Analysis endpoints (matching your FastAPI routes)
  HURST_EXPONENT: "/api/v1/analysis/fractal/hurst-exponent",
  FRACTAL_DIMENSION: "/api/v1/analysis/fractal/dimension",
  GARCH_VOLATILITY: "/api/v1/analysis/volatility/garch",
  CVAR_ANALYSIS: "/api/v1/analysis/risk/cvar",
  STRESS_TEST: "/api/v1/analysis/risk/stress-test",
  REGIME_DETECTION: "/api/v1/analysis/regime/detect",
  BATCH_ANALYSIS: "/api/v1/analysis/batch/comprehensive",

  // Simulation endpoints
  FBM_SIMULATION: "/api/v1/simulation/fbm",
  MONTE_CARLO: "/api/v1/simulation/monte-carlo/portfolio",
  SCENARIO_ANALYSIS: "/api/v1/simulation/scenario/analysis",
  BACKTEST: "/api/v1/simulation/backtest/strategy",
  REALTIME_SIM_START: "/api/v1/simulation/realtime/start",
  REALTIME_SIM_STATUS: "/api/v1/simulation/realtime/{simulation_id}/status",
  REALTIME_SIM_STOP: "/api/v1/simulation/realtime/{simulation_id}/stop",

  // Portfolio management
  CREATE_PORTFOLIO: "/api/v1/portfolio/create",
  REBALANCE_PORTFOLIO: "/api/v1/portfolio/{portfolio_id}/rebalance",
  OPTIMIZATION_SUGGESTIONS:
    "/api/v1/portfolio/{portfolio_id}/optimization/suggestions",

  // Risk management
  HEDGING_SUGGESTIONS: "/api/v1/risk/hedging/suggestions",
  CONFIGURE_ALERTS: "/api/v1/risk/alerts/configure",

  // Trading
  CREATE_ORDERS: "/api/v1/trading/orders/create",
  ORDER_STATUS: "/api/v1/trading/orders/{order_id}/status",

  // Reporting
  GENERATE_REPORT: "/api/v1/reports/generate",

  // AI Assistant endpoints (matching your FastAPI routes)
  AI_ASSISTANT: "/api/v1/ai/assistant",
  AI_ORCHESTRATOR: "/api/v1/ai/orchestrator/query",
  AI_EXPLAIN: "/api/v1/ai/assistant/explain",
  AI_RECOMMEND: "/api/v1/ai/assistant/recommend",
  AI_INTERPRET: "/api/v1/ai/assistant/interpret",
  AI_SYSTEM_STATUS: "/api/v1/ai/system/status",

  // Utility endpoints
  TASK_RESULT: "/api/v1/tasks/{task_id}/result",
  DOWNLOAD_FILE: "/api/v1/downloads/{file_id}",
};

export const WEBSOCKET_ENDPOINTS = {
  PORTFOLIO_UPDATES: "/api/v1/ws/portfolio/{portfolio_id}/updates",
  MARKET_REGIME: "/api/v1/ws/market/regime-changes",
  RISK_ALERTS: "/api/v1/ws/alerts/risk-breaches",
};

// Keep your existing ApiError class
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Enhanced API client with better error handling and debugging
const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Debug logging
    if (import.meta.env.VITE_DEBUG_API === "true") {
      console.log(`API Request: ${options.method || "GET"} ${url}`, config);
    }

    try {
      const response = await fetch(url, config);

      // Handle different content types
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message ||
            data?.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`Network error for ${url}:`, error);
      throw new ApiError(
        "Network error - check if backend is running",
        0,
        null
      );
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  },
};

// Enhanced service functions matching your FastAPI structure
export const portfolioService = {
  async getOverview(portfolioId = "default") {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          totalValue: 52800.75,
          oneDayReturn: -0.004,
          overallReturn: 0.085,
        },
      };
    }
    return apiClient.get(
      API_ENDPOINTS.OPTIMIZATION_SUGGESTIONS.replace(
        "{portfolio_id}",
        portfolioId
      )
    );
  },

  async getRiskMetrics() {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          overallRiskScore: 3.2,
          valueAtRisk: 25400.0,
        },
      };
    }

    // Calculate CVaR with mock data for now
    const mockReturns = Array.from(
      { length: 100 },
      () => (Math.random() - 0.5) * 0.1
    );
    return apiClient.post(API_ENDPOINTS.CVAR_ANALYSIS, {
      portfolio_returns: mockReturns,
      confidence_level: 0.95,
    });
  },

  async createPortfolio(portfolioData) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: { portfolio_id: "mock_portfolio_123" },
      };
    }
    return apiClient.post(API_ENDPOINTS.CREATE_PORTFOLIO, portfolioData);
  },

  async rebalancePortfolio(portfolioId, rebalanceData) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: { rebalance_id: "mock_rebalance_123" },
      };
    }
    return apiClient.post(
      API_ENDPOINTS.REBALANCE_PORTFOLIO.replace("{portfolio_id}", portfolioId),
      rebalanceData
    );
  },
};

export const analyticsService = {
  async getHurstExponent(data) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        hurst_exponent: 0.42,
        interpretation: "mean-reverting",
        metadata: { computation_time_ms: 245 },
      };
    }
    return apiClient.post(API_ENDPOINTS.HURST_EXPONENT, { data });
  },

  async getGarchForecast(returns, forecastHorizon = 30) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          in_sample_volatility: Array.from(
            { length: 50 },
            () => 0.015 + Math.random() * 0.01
          ),
          forecast_volatility: Array.from(
            { length: forecastHorizon },
            () => 0.022 + Math.random() * 0.005
          ),
        },
      };
    }
    return apiClient.post(API_ENDPOINTS.GARCH_VOLATILITY, {
      returns,
      forecast_horizon: forecastHorizon,
    });
  },

  async detectRegimes(marketData, nRegimes = 3) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          current_regime: "Low Volatility",
          regimes: ["Low Vol", "Mid Vol", "High Vol"],
          transition_matrix: [
            [0.95, 0.04, 0.01],
            [0.2, 0.75, 0.05],
            [0.1, 0.3, 0.6],
          ],
        },
      };
    }
    return apiClient.post(API_ENDPOINTS.REGIME_DETECTION, {
      market_data: marketData,
      n_regimes: nRegimes,
      covariance_type: "full",
    });
  },

  async runFBMSimulation(params = {}) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          num_paths: 10,
          simulation_days: 252,
          summary_statistics: {
            mean_final_value: 110.5,
            median_final_value: 108.2,
            std_final_value: 15.3,
          },
          paths: [], // Would contain actual path data
        },
      };
    }

    const defaultParams = {
      initial_price: 100,
      hurst: 0.7,
      days: 252,
      volatility: 0.2,
      drift: 0.05,
      num_paths: 10,
    };

    return apiClient.post(API_ENDPOINTS.FBM_SIMULATION, {
      ...defaultParams,
      ...params,
    });
  },

  async runStressTest(portfolioPositions, stressScenarios) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          scenario_results: [
            {
              scenario_name: "market_crash_2008",
              portfolio_loss: -285000,
              loss_percentage: -28.5,
            },
          ],
        },
      };
    }
    return apiClient.post(API_ENDPOINTS.STRESS_TEST, {
      portfolio_positions: portfolioPositions,
      stress_scenarios: stressScenarios,
    });
  },
};

export const aiService = {
  async queryOrchestrator(query, context = {}) {
    if (ENABLE_MOCK) {
      return {
        success: true,
        ai_response: {
          message: `Mock AI response to: "${query.slice(0, 50)}..."`,
        },
      };
    }
    return apiClient.post(API_ENDPOINTS.AI_ORCHESTRATOR, { query, context });
  },

  async getSystemStatus() {
    if (ENABLE_MOCK) {
      return {
        success: true,
        system_status: {
          status: "running",
          agents: ["portfolio_analyst", "risk_manager"],
        },
      };
    }
    return apiClient.get(API_ENDPOINTS.AI_SYSTEM_STATUS);
  },

  async explainConcept(concept, detailLevel = "intermediate") {
    if (ENABLE_MOCK) {
      return {
        success: true,
        data: {
          explanation: `Mock explanation of ${concept}`,
          detail_level: detailLevel,
        },
      };
    }
    return apiClient.post(API_ENDPOINTS.AI_EXPLAIN, {
      concept,
      detail_level: detailLevel,
      context: "general",
    });
  },
};

export const utilityService = {
  async healthCheck() {
    return apiClient.get(API_ENDPOINTS.HEALTH);
  },

  async getTaskResult(taskId) {
    return apiClient.get(
      API_ENDPOINTS.TASK_RESULT.replace("{task_id}", taskId)
    );
  },
};

// WebSocket helper
export const createWebSocketConnection = (endpoint, portfolioId = null) => {
  const wsBaseUrl = API_BASE_URL.replace("http", "ws");
  let wsUrl = `${wsBaseUrl}${endpoint}`;

  if (portfolioId) {
    wsUrl = wsUrl.replace("{portfolio_id}", portfolioId);
  }

  return new WebSocket(wsUrl);
};

// Export the main API client for direct use if needed
export { apiClient, ApiError };
