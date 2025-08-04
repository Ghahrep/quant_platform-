const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Base API client
const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'API request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, null);
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  },
};

// API service functions
export const portfolioService = {
  async getOverview() {
    if (ENABLE_MOCK) {
      return {
        /* mock data */
      };
    }
    return apiClient.get('/portfolio/overview');
  },

  async getRiskMetrics() {
    if (ENABLE_MOCK) {
      return {
        /* mock data */
      };
    }
    return apiClient.get('/portfolio/risk-metrics');
  },
};

export const analyticsService = {
  async getHurstExponent(data) {
    if (ENABLE_MOCK) {
      return { hurst_exponent: 0.42, interpretation: 'mean-reverting' };
    }
    return apiClient.post('/analysis/fractal/hurst-exponent', { data });
  },

  async getGarchForecast(data) {
    if (ENABLE_MOCK) {
      return {
        /* mock forecast data */
      };
    }
    return apiClient.post('/analysis/garch/forecast', { data });
  },
};
