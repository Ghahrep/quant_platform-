/**
 * Test component to verify AuthContext works correctly
 * Create this in your src folder temporarily to test
 */

import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Test component that uses the auth context
function AuthTestComponent() {
  const auth = useAuth();

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Auth Context Test</h3>
      <div className="space-y-1 text-sm">
        <div>Is Loading: {auth.isLoading ? "Yes" : "No"}</div>
        <div>Is Authenticated: {auth.isAuthenticated ? "Yes" : "No"}</div>
        <div>User: {auth.user ? auth.user.email : "None"}</div>
        <div>Error: {auth.error || "None"}</div>
      </div>

      <div className="mt-3 space-x-2">
        <button
          onClick={() =>
            console.log("Login function available:", typeof auth.login)
          }
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Test Login Function
        </button>
        <button
          onClick={() =>
            console.log("Register function available:", typeof auth.register)
          }
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Test Register Function
        </button>
      </div>
    </div>
  );
}

// Main test component wrapped with AuthProvider
export default function TestAuthContext() {
  return (
    <AuthProvider>
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">AuthContext Integration Test</h2>
        <AuthTestComponent />
      </div>
    </AuthProvider>
  );
}
