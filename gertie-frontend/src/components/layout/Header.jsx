import React from "react";
import { Bell, Sun, Moon } from "lucide-react";
import { GertieLogo } from "../ui";

export const Header = ({ toggleTheme, activeView }) => (
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
        AC
      </div>
    </div>
  </header>
);

// Also export as default for compatibility
export default Header;
