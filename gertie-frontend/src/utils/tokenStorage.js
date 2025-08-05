// src/utils/tokenStorage.js

const TOKEN_KEY = "gertie_auth_token";

/**
 * Stores the authentication token in localStorage.
 * @param {string} token The JWT token to store.
 */
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving token to localStorage", error);
  }
};

/**
 * Retrieves the authentication token from localStorage.
 * @returns {string|null} The token, or null if not found.
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token from localStorage", error);
    return null;
  }
};

/**
 * Removes the authentication token from localStorage.
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error removing token from localStorage", error);
  }
};

/**
 * Decodes the JWT token to get its payload without verifying the signature.
 * @param {string} token The JWT token.
 * @returns {object|null} The decoded payload, or null if invalid.
 */
const decodeToken = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return null;
    }
    const decodedJson = atob(payloadBase64);
    return JSON.parse(decodedJson);
  } catch (error) {
    console.error("Error decoding token", error);
    return null;
  }
};

/**
 * Checks if a token is expired.
 * @param {string} token The JWT token.
 * @returns {boolean} True if the token is expired, false otherwise.
 */
export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true; // Invalid token or no expiration claim
  }
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const isExpired = Date.now() > expirationTime;

  if (isExpired) {
    console.warn("Authentication token has expired.");
  }

  return isExpired;
};

/**
 * Extracts user data from the token payload.
 * Modify this based on your actual JWT payload structure.
 * @param {string} token The JWT token.
 * @returns {object|null} The user data, or null if invalid.
 */
export const getTokenData = (token) => {
  if (!token) {
    return null;
  }
  const decoded = decodeToken(token);
  // Assuming your backend puts user info in a 'user' object or directly in the payload
  // Common payload fields are 'sub' (subject/id), 'email', 'name', etc.
  if (decoded) {
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      // Add any other user fields you expect in the token
    };
  }
  return null;
};
