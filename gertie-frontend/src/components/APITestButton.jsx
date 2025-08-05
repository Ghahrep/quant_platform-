import React, { useState } from "react";
import { utilityService } from "../services/api";

export const APITestButton = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await utilityService.healthCheck();
      setResult({ success: true, data: response });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg m-4">
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Backend Connection"}
      </button>
      {result && (
        <pre className="mt-2 text-xs text-green-400">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};
