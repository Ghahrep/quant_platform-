import React from "react";
import {
  Shield,
  LayoutDashboard,
  BarChart2,
  Bell,
  Settings,
} from "lucide-react";
import { GertieLogo } from "../ui";

export const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Analytics", icon: BarChart2 },
    { name: "Allocations", icon: Shield },
    { name: "Alerts", icon: Bell },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 p-6">
      <div className="flex items-center space-x-2 mb-8">
        <GertieLogo className="w-10 h-10" />
        <h1 className="text-2xl font-bold text-white">Gertie.ai</h1>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => setActiveView(item.name)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.name
                    ? "bg-slate-800 text-white"
                    : "hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800/50">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

// Also export as default for compatibility
export default Sidebar;
