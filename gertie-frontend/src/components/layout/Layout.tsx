// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Bot,
  Search, 
  TestTube, 
  AlertTriangle, 
  FileText,
  Menu,
  X,
  Bell,
  Settings,
  User,
  LogOut,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: PieChart },
    { name: 'Simulator', href: '/simulator', icon: Activity, highlight: true }, // New fBm Simulator
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot, highlight: true }, // AI Assistant - CORRECTED PATH
    { name: 'Research', href: '/research', icon: Search },
    { name: 'Backtesting', href: '/backtesting', icon: TestTube },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const isActive = (href: string) => {
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">Gertie.ai</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 relative
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${item.highlight ? 'group' : ''}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.highlight && (
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <div className="flex-1"></div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full">
                  <Bell className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">User</p>
                    <p className="text-xs text-gray-500">Portfolio Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
