import { useState, useEffect, useRef } from "react";
import { createWebSocketConnection } from "../services/api";

export const useWebSocket = (endpoint, portfolioId = null) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Ensure we don't create multiple connections
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      wsRef.current = createWebSocketConnection(endpoint, portfolioId);
      setConnectionStatus("connecting");

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected to ${endpoint}`);
        setConnectionStatus("connected");
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      wsRef.current.onclose = () => {
        console.log(`WebSocket disconnected from ${endpoint}`);
        setConnectionStatus("disconnected");
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection failed.");
        setConnectionStatus("error");
      };
    } catch (err) {
      setError(err.message);
      setConnectionStatus("error");
    }

    // Cleanup function to close the connection when the component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [endpoint, portfolioId]); // Re-run the effect if the endpoint or portfolioId changes

  return { data, connectionStatus, error };
};
