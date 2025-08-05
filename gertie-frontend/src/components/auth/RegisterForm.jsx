// src/components/auth/RegisterForm.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { User, Mail, Lock, AlertCircle } from "lucide-react";
import { GertieLogo } from "../ui";

const RegisterForm = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    // --- Basic Validation ---
    if (!username || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await register({ username, email, password, confirmPassword });
      // On success, AuthContext will handle the auto-login
      // and App.jsx will automatically show the dashboard.
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false); // Only stop loading on error
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700">
      <div className="flex flex-col items-center space-y-2">
        <GertieLogo className="w-12 h-12" />
        <h2 className="text-2xl font-bold text-center text-white">
          Create an Account
        </h2>
        <p className="text-center text-slate-400">Join Gertie.ai today</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="username"
            className="text-sm font-medium text-slate-300 block mb-2"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              placeholder="your_username"
              required
            />
          </div>
        </div>
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-300 block mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-900/40 p-3 rounded-md border border-red-800/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-yellow-500 text-slate-900 font-semibold rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-yellow-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{" "}
        <button
          onClick={onSwitch}
          disabled={loading}
          className="font-medium text-yellow-400 hover:underline disabled:opacity-50"
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
