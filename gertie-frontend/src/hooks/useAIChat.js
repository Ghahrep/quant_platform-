import { useState } from "react";
import { aiService } from "../services/api";

export const useAIChat = () => {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm Gertie, your AI risk companion. How can I help you analyze your portfolio today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (userMessage) => {
    try {
      setLoading(true);
      setError(null);

      // Add user message immediately
      const userMsg = { from: "user", text: userMessage };
      setMessages((prev) => [...prev, userMsg]);

      // Call AI orchestrator
      const response = await aiService.queryOrchestrator(userMessage, {
        portfolio_analysis: true,
        risk_assessment: true,
      });

      // Add AI response
      const aiMsg = {
        from: "ai",
        text:
          response.ai_response?.message ||
          response.data?.message ||
          "I'm processing your request...",
      };
      setMessages((prev) => [...prev, aiMsg]);

      return response;
    } catch (err) {
      setError(err.message);
      console.error("AI chat error:", err);

      // Fallback response
      const errorMsg = {
        from: "ai",
        text: "I'm currently experiencing some technical difficulties. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getAISystemStatus = async () => {
    try {
      const response = await aiService.getSystemStatus();
      return response.system_status || { status: "unknown" };
    } catch (err) {
      console.error("AI system status error:", err);
      return { status: "offline" };
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    getAISystemStatus,
    setMessages,
  };
};
