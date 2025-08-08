import React, { useState } from "react";
// --- STEP 1: Import the necessary hooks and services ---
import { useAuth } from "../contexts/AuthContext";
// The authService is not directly used here, as the login/register logic
// is encapsulated within the useAuth hook, which is the correct pattern.

// --- UI Components (self-contained for this example) ---
import { AlertCircle, Loader2 } from "lucide-react";

// ==============================================================================
// LOGIN FORM COMPONENT
// This component now uses the login function from the useAuth hook.
// ==============================================================================
const LoginForm = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // On successful login, the AuthProvider will handle navigation
      // or the parent component will re-render. No need for navigation here.
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-white">
        Welcome Back
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        {error && (
          <div className="flex items-center text-sm text-red-400 bg-red-900/30 p-3 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-slate-600"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In"}
          </button>
        </div>
      </form>
      <p className="text-sm text-center text-slate-400">
        Don't have an account?{" "}
        <button
          onClick={onSwitch}
          className="font-medium text-cyan-400 hover:text-cyan-300"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

// ==============================================================================
// REGISTER FORM COMPONENT
// This component now uses the register function from the useAuth hook.
// ==============================================================================
const RegisterForm = ({ onSwitch }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(formData);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-white">
        Create Account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inputs for username, email, password, confirmPassword */}
        <input
          name="username"
          type="text"
          placeholder="Username"
          onChange={handleChange}
          required
          className="w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          onChange={handleChange}
          required
          className="w-full px-3 py-2 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {error && (
          <div className="flex items-center text-sm text-red-400 bg-red-900/30 p-3 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-slate-600"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
        </button>
      </form>
      <p className="text-sm text-center text-slate-400">
        Already have an account?{" "}
        <button
          onClick={onSwitch}
          className="font-medium text-cyan-400 hover:text-cyan-300"
        >
          Log in
        </button>
      </p>
    </div>
  );
};

// ==============================================================================
// MAIN AUTH PAGE COMPONENT (The Container)
// This component's logic remains the same.
// ==============================================================================
export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => setIsLoginView(!isLoginView);

  return (
    <div className="flex items-center justify-center h-full w-full py-12">
      {isLoginView ? (
        <LoginForm onSwitch={toggleView} />
      ) : (
        <RegisterForm onSwitch={toggleView} />
      )}
    </div>
  );
};

export default AuthPage;
