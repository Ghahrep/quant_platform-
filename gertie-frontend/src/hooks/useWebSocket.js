// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { createWebSocketConnection } from "../services/api";

const useWebSocket = (endpoint, portfolioId, options = {}) => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;

  const connect = useCallback(() => {
    if (!endpoint) {
      console.warn("useWebSocket: No endpoint provided");
      return;
    }

    try {
      console.log(`Attempting to connect to WebSocket: ${endpoint}`);

      // Use the placeholder service for now
      const ws = createWebSocketConnection(endpoint, {
        portfolioId,
        ...options,
      });

      if (!ws) {
        console.warn(
          "WebSocket service returned null - feature not implemented yet"
        );
        setError(new Error("WebSocket service not available"));
        return;
      }

      wsRef.current = ws;

      // WebSocket event handlers
      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          setLastMessage(message);
        } catch (parseError) {
          console.error("Failed to parse WebSocket message:", parseError);
          setLastMessage({ type: "error", data: "Invalid message format" });
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection if not a manual close
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay =
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError(new Error("Maximum reconnection attempts reached"));
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError(error);
      };
    } catch (connectionError) {
      console.error("Failed to create WebSocket connection:", connectionError);
      setError(connectionError);
    }
  }, [endpoint, portfolioId, maxReconnectAttempts, reconnectInterval, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("Manually closing WebSocket connection");
      wsRef.current.close(1000, "Manual disconnect");
    }

    wsRef.current = null;
    setIsConnected(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected. Cannot send message:", message);
      return false;
    }

    try {
      const messageString =
        typeof message === "string" ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      console.log("WebSocket message sent:", message);
      return true;
    } catch (sendError) {
      console.error("Failed to send WebSocket message:", sendError);
      setError(sendError);
      return false;
    }
  }, []);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (endpoint) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, endpoint]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
};

// Export as both default and named export for flexibility
export default useWebSocket;
export { useWebSocket };
