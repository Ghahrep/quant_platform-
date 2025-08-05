// FILE: src/App.jsx (CORRECTED)
// This version stabilizes the rendering logic to prevent login issues.

import React, { useState } from "react";
import { Bot } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";
import { DashboardPage } from "./pages/DashboardPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AllocationsPage } from "./pages/AllocationsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AIAgentChat } from "./pages/AIAgentChat";
import { AuthPage } from "./pages/AuthPage";
import { PortfolioPage } from "./pages/PortfolioPage";

// This component renders the correct page based on the active view.
const MainContent = ({ activeView }) => {
  switch (activeView) {
    case "Analytics":
      return <AnalyticsPage />;
    case "Allocations":
      return <AllocationsPage />;
    case "Alerts":
      return <AlertsPage />;
    case "Portfolio":
      return <PortfolioPage />;
    case "Overview":
    default:
      return <DashboardPage />;
  }
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [activeView, setActiveView] = useState("Overview");
  const [isChatOpen, setChatOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // While the context is checking for a token, show a loading screen.
  if (isLoading) {
    return (
      <div className="dark bg-slate-900 min-h-screen flex items-center justify-center text-white text-xl">
        Loading Gertie.ai...
      </div>
    );
  }

  // If the user is NOT authenticated, show the AuthPage.
  // This is now the single source of truth for showing the login/register page.
  if (!isAuthenticated) {
    return (
      <div className="dark bg-slate-900 min-h-screen">
        <AuthPage />
      </div>
    );
  }

  // If they ARE authenticated, show the full application dashboard.
  return (
    <div className={`${theme} bg-slate-900 font-sans min-h-screen`}>
      <div className="flex h-screen w-full text-slate-300">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex flex-col flex-1">
          <Header toggleTheme={toggleTheme} activeView={activeView} />
          <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto pb-24 lg:pb-6">
            <MainContent activeView={activeView} />
          </main>
          <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
      </div>
      <button
        onClick={() => setChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-yellow-500 text-slate-900 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-yellow-400 transition-transform hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-8 h-8" />
      </button>
      <AIAgentChat isChatOpen={isChatOpen} setChatOpen={setChatOpen} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
