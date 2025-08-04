import React from 'react';
import { Menu, Bell, User, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-300" />
        </button>

        {/* Page title */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Financial Risk Management
          </h2>
          <p className="text-sm text-gray-400">
            Real-time portfolio analysis and optimization
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Toggle theme"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-gray-300" />
          ) : (
            <Moon className="h-5 w-5 text-gray-300" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors relative">
          <Bell className="h-5 w-5 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            2
          </span>
        </button>

        {/* User menu */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-900" />
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">Portfolio Manager</span>
        </div>
      </div>
    </header>
  );
};