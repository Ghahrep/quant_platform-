import { useState, useCallback } from "react";
// --- STEP 1: Import the new service and auth hook ---
import { useAuth } from "../contexts/AuthContext";
import { aiService } from "../services/api"; // Assuming api.js is in src/services/

export const useAIChat = () => {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm Gertie, your AI risk companion. How can I help you analyze your portfolio today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // --- Get isAuthenticated state for cleaner checks ---
  const { isAuthenticated } = useAuth();

  // --- STEP 2: Refactor sendMessage to use the service ---
  const sendMessage = useCallback(
    async (messageText, conversationId) => {
      if (!isAuthenticated) {
        setError("You must be logged in to chat with the AI.");
        return;
      }

      setLoading(true);
      setError(null);

      const userMsg = { from: "user", text: messageText };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Use the centralized aiService. It handles the token and URL automatically.
        const response = await aiService.ask(messageText, conversationId);

        // Axios wraps the response body in a `data` property
        const data = response.data;

        const aiMsg = {
          from: "ai",
          text:
            data.message ||
            "I seem to be at a loss for words. Please try again.",
        };
        setMessages((prev) => [...prev, aiMsg]);

        return data; // Return the full response data for potential use in the component
      } catch (err) {
        console.error("AI chat error:", err);
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          "An unknown error occurred.";
        setError(errorMessage);

        const errorMsg = {
          from: "ai",
          text: "I'm currently experiencing some technical difficulties. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  ); // Dependency ensures the function is stable and aware of auth state

  // --- STEP 3: Refactor getAISystemStatus (optional but good practice) ---
  const getAISystemStatus = useCallback(async () => {
    if (!isAuthenticated) return { status: "offline" };

    try {
      // Assuming you add getSystemStatus to your aiService in api.js
      // const response = await aiService.getSystemStatus();
      // return response.data.system_status || { status: "unknown" };

      // For now, returning a mock response as this endpoint might not be in your service file yet.
      console.log("Fetching AI system status...");
      return {
        status: "online",
        agents: ["QuantitativeAnalyst", "StrategyArchitect"],
      };
    } catch (err) {
      console.error("AI system status error:", err);
      return { status: "offline" };
    }
  }, [isAuthenticated]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    getAISystemStatus,
    setMessages,
  };
};
