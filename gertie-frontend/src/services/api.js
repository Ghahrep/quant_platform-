// src/services/api.js
import axios from "axios";
import { getToken, removeToken } from "../utils/tokenStorage";

// API Configuration
const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:8000/api/v1";

// API Endpoints
const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    profile: "/auth/me",
  },
  // Portfolio Management
  portfolio: {
    get: "/portfolios/me",
    uploadCSV: "/portfolios/upload-csv",
    uploadPositions: "/portfolios/positions",
    bulkCreate: "/portfolios/bulk-create",
    create: "/portfolios",
    update: "/portfolios",
    delete: "/portfolios",
  },
  // Analysis (placeholder for future implementation)
  analysis: {
    beta: "/analysis/portfolio/beta",
    cvar: "/analysis/risk/cvar",
    allocation: "/analysis/allocation",
  },
};

// WebSocket Endpoints (placeholder for real-time features)
const WEBSOCKET_ENDPOINTS = {
  portfolio: {
    updates: "/ws/portfolio/updates",
    alerts: "/ws/portfolio/alerts",
    realtime: "/ws/portfolio/realtime",
  },
  market: {
    prices: "/ws/market/prices",
    news: "/ws/market/news",
  },
  alerts: {
    notifications: "/ws/alerts/notifications",
    portfolio_alerts: "/ws/alerts/portfolio",
    price_alerts: "/ws/alerts/prices",
  },
  // Helper function to build full WebSocket URLs
  buildWSUrl: (endpoint) => {
    const baseWSUrl =
      (typeof process !== "undefined" && process.env?.REACT_APP_WS_URL) ||
      "ws://localhost:8000";
    return `${baseWSUrl}${endpoint}`;
  },
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Token attached to request:", token.substring(0, 20) + "...");
    } else {
      console.warn("No authentication token found");
    }

    // Log request details for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data instanceof FormData ? "FormData" : config.data,
    });

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} ${response.config.url}`,
      response.data
    );
    return response;
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn("Authentication failed, removing token");
      removeToken();

      // Optionally redirect to login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Enhance error object with more details
    const enhancedError = {
      ...error,
      isAPIError: true,
      status: error.response?.status,
      serverMessage:
        error.response?.data?.message || error.response?.data?.detail,
      validationErrors: error.response?.data?.detail || [],
    };

    return Promise.reject(enhancedError);
  }
);

// Authentication Service
export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.auth.login,
        credentials
      );
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Login failed");
    }
  },

  async register(userData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.auth.register,
        userData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Registration failed");
    }
  },

  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.auth.profile);
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Failed to fetch profile");
    }
  },
};

// Portfolio Service
export const portfolioService = {
  async getPortfolio() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.portfolio.get);

      // Ensure consistent data structure
      const portfolioData = response.data;

      // Validate response structure
      if (!portfolioData || typeof portfolioData !== "object") {
        throw new Error("Invalid portfolio data received from server");
      }

      // Normalize portfolio structure
      const normalizedPortfolio = {
        last_updated: portfolioData.last_updated || null,
        positions: Array.isArray(portfolioData.positions)
          ? portfolioData.positions
          : [],
        summary: portfolioData.summary || {
          total_positions: portfolioData.positions?.length || 0,
          total_market_value: 0,
          user_id: portfolioData.user_id || null,
        },
      };

      console.log("Normalized portfolio data:", normalizedPortfolio);
      return normalizedPortfolio;
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      throw new Error(error.serverMessage || "Failed to fetch portfolio data");
    }
  },

  async uploadCSVData(positions) {
    try {
      // Validate positions array
      if (!Array.isArray(positions)) {
        throw new Error("Invalid positions data. Expected array.");
      }

      if (positions.length === 0) {
        throw new Error("No positions to upload.");
      }

      console.log("Uploading positions as direct array:", positions);

      // FIXED: Backend expects direct array, not wrapped in object
      const response = await apiClient.post(
        API_ENDPOINTS.portfolio.uploadCSV,
        positions,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 seconds
        }
      );

      console.log("CSV upload successful:", response.data);

      // Validate and normalize response
      const portfolioData = response.data;

      const normalizedPortfolio = {
        last_updated: portfolioData.last_updated || new Date().toISOString(),
        positions: Array.isArray(portfolioData.positions)
          ? portfolioData.positions
          : [],
        summary: portfolioData.summary || {
          total_positions: portfolioData.positions?.length || 0,
          total_market_value:
            portfolioData.positions?.reduce(
              (sum, pos) => sum + (pos.quantity || 0) * (pos.unit_cost || 0),
              0
            ) || 0,
          user_id: portfolioData.user_id || null,
        },
      };

      return { data: normalizedPortfolio };
    } catch (error) {
      console.error("CSV data upload failed:", error);

      // Create detailed error message for 422 validation errors
      if (error.status === 422 && error.validationErrors) {
        const validationDetails = Array.isArray(error.validationErrors)
          ? error.validationErrors
              .map((err) => `${err.loc?.join(".") || "Field"}: ${err.msg}`)
              .join("\n")
          : error.validationErrors;

        error.message = `Validation Error:\n${validationDetails}`;
      }

      throw error;
    }
  },

  async uploadCSV(formData) {
    try {
      // Validate FormData
      if (!(formData instanceof FormData)) {
        throw new Error("Invalid file data. Expected FormData object.");
      }

      // Check if file is present
      const file = formData.get("file");
      if (!file) {
        throw new Error("No file found in upload data.");
      }

      console.log("Uploading CSV file:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Create request with proper headers for file upload
      const response = await apiClient.post(
        API_ENDPOINTS.portfolio.uploadCSV,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Increase timeout for large files
          timeout: 60000, // 60 seconds
        }
      );

      // Validate and normalize response
      const portfolioData = response.data;

      if (!portfolioData || typeof portfolioData !== "object") {
        throw new Error("Invalid response from CSV upload");
      }

      const normalizedPortfolio = {
        last_updated: portfolioData.last_updated || new Date().toISOString(),
        positions: Array.isArray(portfolioData.positions)
          ? portfolioData.positions
          : [],
        summary: portfolioData.summary || {
          total_positions: portfolioData.positions?.length || 0,
          total_market_value:
            portfolioData.positions?.reduce(
              (sum, pos) => sum + (pos.quantity || 0) * (pos.unit_cost || 0),
              0
            ) || 0,
          user_id: portfolioData.user_id || null,
        },
      };

      console.log("CSV upload successful:", normalizedPortfolio);
      return { data: normalizedPortfolio };
    } catch (error) {
      console.error("CSV upload failed:", error);

      // Create detailed error message for 422 validation errors
      if (error.status === 422 && error.validationErrors) {
        const validationDetails = Array.isArray(error.validationErrors)
          ? error.validationErrors
              .map((err) => `${err.loc?.join(".") || "Field"}: ${err.msg}`)
              .join("\n")
          : error.validationErrors;

        error.message = `Validation Error:\n${validationDetails}`;
      }

      throw error;
    }
  },

  async createPosition(positionData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.portfolio.create,
        positionData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Failed to create position");
    }
  },

  async updatePosition(positionId, positionData) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.portfolio.update}/${positionId}`,
        positionData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Failed to update position");
    }
  },

  async deletePosition(positionId) {
    try {
      const response = await apiClient.delete(
        `${API_ENDPOINTS.portfolio.delete}/${positionId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.serverMessage || "Failed to delete position");
    }
  },
};

// Analysis Service (placeholder for future implementation)
export const analysisService = {
  async getPortfolioBeta() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.analysis.beta);
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        console.warn("Beta analysis endpoint not implemented yet");
        return { beta: null, message: "Analysis feature coming soon" };
      }
      throw new Error(error.serverMessage || "Failed to fetch portfolio beta");
    }
  },

  async getRiskMetrics() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.analysis.cvar);
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        console.warn("Risk analysis endpoint not implemented yet");
        return { cvar: null, message: "Risk analysis feature coming soon" };
      }
      throw new Error(error.serverMessage || "Failed to fetch risk metrics");
    }
  },
};

// AI Service (placeholder for AI chat functionality)
export const aiService = {
  async ask(message, conversationId = null) {
    try {
      const payload = {
        message,
        conversation_id: conversationId,
      };

      console.log("AI Service: Sending message:", payload);

      // Placeholder endpoint - adjust URL when AI backend is implemented
      const response = await apiClient.post("/ai/chat", payload);
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.warn("AI chat endpoint not implemented yet");
        // Return a mock response for development
        return {
          data: {
            message:
              "I'm sorry, but the AI service is not yet available. This feature is coming soon!",
            conversation_id:
              conversationId || "mock-conversation-" + Date.now(),
            timestamp: new Date().toISOString(),
          },
        };
      }
      throw new Error(error.serverMessage || "Failed to send message to AI");
    }
  },

  async getSystemStatus() {
    try {
      const response = await apiClient.get("/ai/status");
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.warn("AI status endpoint not implemented yet");
        return {
          data: {
            status: "offline",
            message: "AI service not implemented yet",
            agents: [],
          },
        };
      }
      throw new Error(error.serverMessage || "Failed to get AI system status");
    }
  },

  async getConversationHistory(conversationId) {
    try {
      const response = await apiClient.get(
        `/ai/conversations/${conversationId}`
      );
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.warn("AI conversation history endpoint not implemented yet");
        return {
          data: {
            messages: [],
            conversation_id: conversationId,
          },
        };
      }
      throw new Error(
        error.serverMessage || "Failed to get conversation history"
      );
    }
  },
};

// Health check utility
export const healthService = {
  async checkAPIHealth() {
    try {
      const response = await apiClient.get("/health");
      return response.data;
    } catch (error) {
      throw new Error("API health check failed");
    }
  },

  async checkAuthHealth() {
    try {
      const response = await apiClient.get("/auth/health");
      return response.data;
    } catch (error) {
      throw new Error("Auth service health check failed");
    }
  },
};

// WebSocket Service (placeholder for real-time features)
export const createWebSocketConnection = (url, options = {}) => {
  console.warn(
    `WebSocket service not implemented yet. Would connect to: ${url}`,
    options
  );

  // Return a mock WebSocket-like object to prevent errors
  return {
    readyState: 0, // CONNECTING
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    send: (data) => {
      console.warn("Mock WebSocket send:", data);
    },
    close: (code = 1000, reason = "Manual close") => {
      console.warn("Mock WebSocket close:", code, reason);
      if (this.onclose) {
        this.onclose({ code, reason });
      }
    },
  };
};

export const websocketService = {
  createWebSocketConnection,

  connect(url, options = {}) {
    console.warn("WebSocket connection not implemented yet");
    return createWebSocketConnection(url, options);
  },

  disconnect() {
    console.warn("WebSocket disconnection not implemented yet");
  },
};

// Export the configured axios instance for direct use if needed
export default apiClient;

// Named exports for backward compatibility
export { apiClient, API_ENDPOINTS, API_BASE_URL, WEBSOCKET_ENDPOINTS };
