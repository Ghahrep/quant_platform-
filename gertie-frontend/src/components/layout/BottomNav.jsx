import React from "react";
import { Shield, BarChart2, Bell, Home } from "lucide-react";

export const BottomNav = ({ activeView, setActiveView }) => {
  const navItems = [
    { name: "Overview", icon: Home },
    { name: "Allocations", icon: Shield },
    { name: "Analytics", icon: BarChart2 },
    { name: "Alerts", icon: Bell },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 flex justify-around p-2 z-20">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => setActiveView(item.name)}
          className={`flex flex-col items-center space-y-1 p-2 rounded-md transition-colors ${
            activeView === item.name
              ? "text-yellow-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs">{item.name}</span>
        </button>
      ))}
    </nav>
  );
};

// Also export as default for compatibility
export default BottomNav;
