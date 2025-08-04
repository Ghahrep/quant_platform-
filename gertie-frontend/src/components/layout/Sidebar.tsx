import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  MessageSquare,
  Bell,
  Settings,
  Brain,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Optimizer',
    href: '/optimizer', 
    icon: Target,
  },
  {
    name: 'Simulator',
    href: '/simulator',
    icon: Zap,
  },
  {
    name: 'AI Assistant',
    href: '/ai-assistant',
    icon: MessageSquare,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  return (
    <aside className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    } flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-amber-400" />
          {isOpen && (
            <div>
              <h1 className="text-white font-bold text-lg">Gertie.ai</h1>
              <p className="text-gray-400 text-xs">Risk Companion</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="ml-3">{item.name}</span>}
            </NavLink>
          );
        })}
        
        {/* Divider */}
        <div className="my-4 border-t border-gray-700" />
        
        {/* Bottom items */}
        <NavLink
          to="/alerts"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Bell className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Alerts</span>}
        </NavLink>
        
        <NavLink
          to="/settings"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Settings</span>}
        </NavLink>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
          <p className="text-xs text-gray-600 mt-1">© 2024 Gertie.ai</p>
        </div>
      )}
    </aside>
  );
};