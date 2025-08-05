// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  getTokenData,
} from "../utils/tokenStorage";

// Define the base URL for your backend API
const API_BASE_URL = "http://localhost:8000/api/v1";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthStateToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkStoredToken = () => {
      try {
        const storedToken = getToken();
        if (storedToken && !isTokenExpired(storedToken)) {
          const userData = getTokenData(storedToken);
          setUser(userData);
          setAuthStateToken(storedToken);
        } else if (storedToken) {
          removeToken();
        }
      } catch (err) {
        console.error("Error processing stored token", err);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };
    checkStoredToken();
  }, []);

  const login = async (email, password) => {
    setError(null);
    // Note: We don't set isLoading here to avoid a full-page loader on login/register.
    // The loading state is handled inside the form components.
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the detailed error message from the backend if available
        throw new Error(
          data.detail || "Login failed. Please check your credentials."
        );
      }

      // The backend returns a token named "access_token"
      const { access_token } = data;
      setToken(access_token); // Store in localStorage
      const userData = getTokenData(access_token);
      setUser(userData);
      setAuthStateToken(access_token); // Update React state
    } catch (err) {
      setError(err.message);
      // Re-throw the error so the form component can catch it and display it
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // FINAL FIX: Add confirm_password to the request body
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          confirm_password: userData.confirmPassword, // Backend expects this snake_case key
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Registration Failed. ";
        if (
          data.detail &&
          typeof data.detail === "object" &&
          data.detail.message
        ) {
          errorMessage +=
            data.detail.message + ": " + (data.detail.errors || []).join(", ");
        } else if (typeof data.detail === "string") {
          errorMessage += data.detail;
        } else if (Array.isArray(data.detail)) {
          // Handle Pydantic validation error format
          const pydanticError = data.detail[0];
          errorMessage += `${pydanticError.loc.join(".")} - ${pydanticError.msg}`;
        }
        throw new Error(errorMessage);
      }

      // Correctly handle the token returned directly by the /register endpoint
      console.log("Registration successful. Token received from backend.");
      const { access_token } = data.token;

      setToken(access_token); // Store in localStorage
      const newUserData = getTokenData(access_token);
      setUser(newUserData);
      setAuthStateToken(access_token); // Update React state
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setAuthStateToken(null);
    setError(null);
  };

  const isAuthenticated = !!token;

  const value = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
