import React from "react";
import { Bell, Sun, Moon, LogOut } from "lucide-react"; // Import LogOut icon
import { GertieLogo } from "../ui";
import { useAuth } from "../../contexts/AuthContext"; // Import useAuth

export const Header = ({ toggleTheme, activeView }) => {
  // Get auth state and the logout function from the context
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Dynamically generate avatar initials
  const avatarInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "GU"; // GU for Guest

  return (
    <header className="flex justify-between items-center p-4 bg-slate-900/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none sticky top-0 z-10">
      <div className="lg:hidden">
        <div className="flex items-center space-x-2">
          <GertieLogo className="w-8 h-8" />
          <h1 className="text-xl font-bold text-white">Gertie.ai</h1>
        </div>
      </div>
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold text-white">{activeView}</h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Optional: You can keep or remove the text status indicator */}
        <div className="text-slate-400 text-sm hidden md:block">
          {isLoading
            ? "Loading..."
            : isAuthenticated
              ? `Logged in as ${user.email}`
              : "Not logged in"}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Sun className="w-5 h-5 hidden dark:block" />
          <Moon className="w-5 h-5 block dark:hidden" />
        </button>
        <div className="relative">
          <Bell className="w-6 h-6 text-slate-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </div>
        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
          {avatarInitials}
        </div>

        {/* --- ADDED LOGOUT BUTTON --- */}
        {isAuthenticated && (
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

// Also export as default for compatibility
export default Header;
