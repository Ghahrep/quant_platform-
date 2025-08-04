// src/App.tsx - FIXED VERSION with all routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider, prefetchCriticalData, useConnectionStatus } from './services/queryClient';
import { Layout } from './components/layout/Layout';

// Import all existing pages (corrected based on actual exports)
import Dashboard from './pages/dashboard/Dashboard'; // Default export
import Analytics from './pages/analytics/Analytics'; // Default export  
import AIAssistant from './pages/ai-assistant/AIAssistant'; // Default export
import FbmSimulatorPage from './pages/simulator/FbmSimulator'; // Default export: FbmSimulatorPage
import Optimizer from './pages/optimizer/Optimizer'; // Default export

// Connection Status Indicator Component
const ConnectionIndicator: React.FC = () => {
  const isConnected = useConnectionStatus();

  if (isConnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">
          Backend connection lost - Attempting to reconnect...
        </span>
      </div>
    </div>
  );
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/fbm-simulator" element={<FbmSimulatorPage />} />
        <Route path="/optimizer" element={<Optimizer />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// Enhanced App Component with API Integration
const App: React.FC = () => {
  React.useEffect(() => {
    // Prefetch critical data when app loads
    prefetchCriticalData().catch(error => {
      console.warn('Failed to prefetch critical data:', error);
    });
  }, []);

  return (
    <QueryProvider showDevtools={true}>
      <Router>
        <div className="App">
          <ConnectionIndicator />
          <AppRoutes />
        </div>
      </Router>
    </QueryProvider>
  );
};

export default App;