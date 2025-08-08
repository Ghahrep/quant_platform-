// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getToken,
  setToken,
  removeToken,
  isTokenExpired,
  getTokenData,
} from "../utils/tokenStorage";

// --- STEP 1: Import the new authService ---
// We no longer need the hardcoded API_BASE_URL here.
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setAuthStateToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This initial token check logic remains the same.
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

  // --- STEP 2: Fixed the login function ---
  const login = async (email, password) => {
    setError(null);
    try {
      // FIXED: Create credentials object before passing to authService
      const credentials = { email, password };
      console.log("AuthContext: Sending login credentials:", credentials);

      // Use the centralized authService with proper credentials object
      const response = await authService.login(credentials);

      console.log("AuthContext: Login response received:", response);

      // Handle the response data structure
      let access_token;

      console.log(
        "AuthContext: Full response structure:",
        JSON.stringify(response, null, 2)
      );

      if (response.token?.access_token) {
        // Backend returns: { token: { access_token: "..." } }
        access_token = response.token.access_token;
      } else if (response.data?.token?.access_token) {
        // Backend returns: { data: { token: { access_token: "..." } } }
        access_token = response.data.token.access_token;
      } else if (response.data?.access_token) {
        // Backend returns: { data: { access_token: "..." } }
        access_token = response.data.access_token;
      } else if (response.access_token) {
        // Backend returns token directly
        access_token = response.access_token;
      } else {
        console.error(
          "AuthContext: Could not find access_token in response:",
          response
        );
        throw new Error("No access token found in response");
      }

      console.log(
        "AuthContext: Extracted access token:",
        access_token?.substring(0, 20) + "..."
      );

      setToken(access_token); // Store in localStorage
      const userData = getTokenData(access_token);
      setUser(userData);
      setAuthStateToken(access_token); // Update React state

      console.log("AuthContext: Login successful, user data:", userData);
    } catch (err) {
      console.error("AuthContext: Login error:", err);

      // Enhanced error handling
      let errorMessage = "Login failed.";

      if (err.response?.status === 422) {
        errorMessage = "Invalid email or password format.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail
            .map((e) => e.msg || e)
            .join(", ");
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // --- STEP 3: Refactor the register function ---
  const register = async (userData) => {
    setError(null);
    try {
      console.log("AuthContext: Sending registration data:", userData);

      // The authService already knows the correct endpoint and body structure
      const response = await authService.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
      });

      console.log("AuthContext: Registration response received:", response);

      // Handle the response data structure
      let access_token;

      if (response.data?.token?.access_token) {
        // Backend returns: { token: { access_token: "..." } }
        access_token = response.data.token.access_token;
      } else if (response.data?.access_token) {
        // Backend returns: { access_token: "..." }
        access_token = response.data.access_token;
      } else if (response.access_token) {
        // Backend returns token directly
        access_token = response.access_token;
      } else {
        throw new Error("No access token found in registration response");
      }

      setToken(access_token); // Store in localStorage
      const newUserData = getTokenData(access_token);
      setUser(newUserData);
      setAuthStateToken(access_token); // Update React state

      console.log(
        "AuthContext: Registration successful, user data:",
        newUserData
      );
    } catch (err) {
      console.error("AuthContext: Registration error:", err);

      let errorMessage = "Registration failed.";

      if (err.response?.status === 422) {
        errorMessage = "Invalid registration data format.";
      } else if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail
            .map((e) => e.msg || e)
            .join(", ");
        } else {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    console.log("AuthContext: Logging out user");
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
