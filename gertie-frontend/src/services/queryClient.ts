// src/services/queryClient.ts - FIXED VERSION
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { apiClient, APIError, checkBackendConnection } from './api/client';
import { portfolioQueries } from './api/portfolioApi';
import { analyticsQueries } from './api/analyticsApi';

// Enhanced Query Client with real API integration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 60000, // 1 minute
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof APIError && error.status === 401) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
        // You can add toast notifications here
      },
    },
  },
});

// Connection status management
let isBackendConnected = false;
let connectionCheckInterval: NodeJS.Timeout | null = null;

// Start periodic backend connection checks
export const startConnectionMonitoring = () => {
  if (connectionCheckInterval) return;

  const checkConnection = async () => {
    const connected = await checkBackendConnection();
    
    if (connected !== isBackendConnected) {
      isBackendConnected = connected;
      
      if (connected) {
        console.log('✅ Backend connection restored');
        // Invalidate all queries to fetch fresh data
        queryClient.invalidateQueries();
      } else {
        console.warn('❌ Backend connection lost');
      }
      
      // Broadcast connection status change
      window.dispatchEvent(new CustomEvent('connectionStatusChange', {
        detail: { connected }
      }));
    }
  };

  // Initial check
  checkConnection();
  
  // Check every 30 seconds
  connectionCheckInterval = setInterval(checkConnection, 30000);
};

// Stop connection monitoring
export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

// Get current connection status
export const getConnectionStatus = () => isBackendConnected;

// Pre-configured queries for immediate use
export const useQueries = {
  // Portfolio data
  portfolioSummary: () => portfolioQueries.summary(),
  riskMetrics: () => portfolioQueries.riskMetrics(),
  assetAllocation: () => portfolioQueries.allocation(),
  holdings: (limit?: number) => portfolioQueries.holdings(limit),
  marketRegime: () => portfolioQueries.marketRegime(),
  recentActivity: (limit?: number) => portfolioQueries.activity(limit),
  riskAlerts: (acknowledged?: boolean) => portfolioQueries.alerts(acknowledged),

  // Analytics data
  fractalAnalysis: (symbol: string) => analyticsQueries.fractalAnalysis(symbol),
  garchAnalysis: (symbol: string) => analyticsQueries.garchAnalysis(symbol),
  cvarAnalysis: () => analyticsQueries.cvarAnalysis(),
  availableSymbols: () => analyticsQueries.availableSymbols(),
  analysisHistory: (type: 'fractal' | 'garch' | 'cvar', limit?: number) => analyticsQueries.analysisHistory(type, limit),

  // Health check
  healthCheck: () => ({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000,
    retry: 3,
    staleTime: 10000,
  }),
};

// Error boundary for API errors
interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({
  children,
  fallback: Fallback
}) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof APIError) {
        setError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const retry = () => {
    setError(null);
    queryClient.invalidateQueries();
  };

  if (error && Fallback) {
    return React.createElement(Fallback, { error, retry });
  }

  if (error) {
    return React.createElement('div', {
      className: "min-h-screen flex items-center justify-center bg-gray-50"
    }, 
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "text-red-500 text-6xl mb-4" }, '⚠️'),
        React.createElement('h1', { className: "text-2xl font-bold text-gray-900 mb-2" }, 'Connection Error'),
        React.createElement('p', { className: "text-gray-600 mb-4" }, 
          error.message || 'Unable to connect to the backend service'
        ),
        React.createElement('button', {
          onClick: retry,
          className: "bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        }, 'Retry Connection')
      )
    );
  }

  return React.createElement(React.Fragment, null, children);
};

// Provider component with enhanced features
interface QueryProviderProps {
  children: React.ReactNode;
  showDevtools?: boolean;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  showDevtools = process.env.NODE_ENV === 'development'
}) => {
  React.useEffect(() => {
    startConnectionMonitoring();
    return () => stopConnectionMonitoring();
  }, []);

  return React.createElement(QueryClientProvider, { client: queryClient },
    React.createElement(QueryErrorBoundary, null, children),
    showDevtools && React.createElement(ReactQueryDevtools, { initialIsOpen: false })
  );
};

// Utility hook for connection status
export const useConnectionStatus = () => {
  const [connected, setConnected] = React.useState(getConnectionStatus);

  React.useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      setConnected(event.detail.connected);
    };

    window.addEventListener('connectionStatusChange', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('connectionStatusChange', handleStatusChange as EventListener);
    };
  }, []);

  return connected;
};

// Prefetch important data on app load
export const prefetchCriticalData = async () => {
  try {
    await Promise.all([
      queryClient.prefetchQuery(portfolioQueries.summary()),
      queryClient.prefetchQuery(portfolioQueries.riskMetrics()),
      queryClient.prefetchQuery(portfolioQueries.alerts()),
    ]);
  } catch (error) {
    console.warn('Failed to prefetch some data:', error);
  }
};