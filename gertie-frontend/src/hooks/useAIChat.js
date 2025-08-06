import { useState } from "react";

export const useAIChat = () => {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm Gertie, your AI risk companion. How can I help you analyze your portfolio today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (messageText, conversationId) => {
    try {
      setLoading(true);
      setError(null);

      const userMsg = { from: "user", text: messageText };
      setMessages((prev) => [...prev, userMsg]);

      // Using the correct token key you provided
      const token = localStorage.getItem("gertie_auth_token");

      const response = await fetch("/api/v1/ai/orchestrator/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // This will now send the correct token
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: messageText,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Server responded with status: ${response.status}. Body: ${errorBody}`
        );
      }

      const data = await response.json();

      const aiMsg = {
        from: "ai",
        text:
          data.message || "I seem to be at a loss for words. Please try again.",
      };
      setMessages((prev) => [...prev, aiMsg]);

      return data;
    } catch (err) {
      setError(err.message);
      console.error("AI chat error:", err);

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
      // Note: For this to work, you need a GET /api/v1/ai/system/status endpoint on your backend
      // as defined in your main.py file.
      const token = localStorage.getItem("gertie_auth_token");

      const response = await fetch("/api/v1/ai/system/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return { status: "offline" };
      const data = await response.json();
      return data.system_status || { status: "unknown" };
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
