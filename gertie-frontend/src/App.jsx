import React, { useState } from "react";
import { Bot } from "lucide-react";

// Layout Components
import { Header, Sidebar, BottomNav } from "./components/layout";

// Page Components
import { DashboardPage } from "./pages/DashboardPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AllocationsPage } from "./pages/AllocationsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AIAgentChat } from "./pages/AIAgentChat";

function App() {
  const [theme, setTheme] = useState("dark");
  const [activeView, setActiveView] = useState("Overview");
  const [isChatOpen, setChatOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const renderActiveView = () => {
    switch (activeView) {
      case "Analytics":
        return <AnalyticsPage />;
      case "Allocations":
        return <AllocationsPage />;
      case "Alerts":
        return <AlertsPage />;
      case "Overview":
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className={`${theme} bg-slate-900 font-sans min-h-screen`}>
      <div className="flex h-screen w-full text-slate-300">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex flex-col flex-1">
          <Header toggleTheme={toggleTheme} activeView={activeView} />
          <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto pb-24 lg:pb-6">
            {renderActiveView()}
          </main>
          <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
      </div>

      {/* AI Agent Floating Action Button & Chat Window */}
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
}

export default App;
