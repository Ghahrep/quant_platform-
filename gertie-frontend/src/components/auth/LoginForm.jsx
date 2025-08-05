// src/components/auth/LoginForm.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { GertieLogo } from "../ui";

// CORRECTED: Added { onSwitch } here to accept the function as a prop
const LoginForm = ({ onSwitch }) => {
  const [email, setEmail] = useState("admin@gertie.ai"); // Pre-filled for demo
  const [password, setPassword] = useState("password123"); // Pre-filled for demo
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // This calls the mock login function in our context
      await login(email, password);
      // On success, the App.jsx component will automatically re-render
      // and show the dashboard. No navigation needed here!
    } catch (err) {
      // When we connect to a real backend, this will catch bad credentials
      setError("Login failed. Please check your credentials.");
      console.error(err);
      setLoading(false);
    }
    // No need to set loading false on success, as the component will unmount
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700">
      <div className="flex flex-col items-center space-y-2">
        <GertieLogo className="w-12 h-12" />
        <h2 className="text-2xl font-bold text-center text-white">
          Welcome Back
        </h2>
        <p className="text-center text-slate-400">
          Sign in to continue to Gertie.ai
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-300 block mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-300 block mb-2"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-900/40 p-3 rounded-md border border-red-800/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-yellow-500 text-slate-900 font-semibold rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-yellow-500 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>
      </form>
      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{" "}
        <button
          onClick={onSwitch}
          className="font-medium text-yellow-400 hover:underline"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
