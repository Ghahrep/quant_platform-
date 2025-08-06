import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Send } from "lucide-react";
// 1. Import the new useAIChat hook
import { useAIChat } from "../hooks/useAIChat";

export const AIAgentChat = ({ isChatOpen, setChatOpen }) => {
  // 2. Replace local state management with the useAIChat hook
  const { messages, loading, sendMessage, getAISystemStatus } = useAIChat();
  const [input, setInput] = useState("");
  const [aiStatus, setAiStatus] = useState("unknown");
  const [conversationId, setConversationId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check AI system status when the chat window is opened
  /*useEffect(() => {
    if (isChatOpen) {
      getAISystemStatus().then((status) => {
        setAiStatus(status.status || "offline");
      });
    }
  }, [isChatOpen, getAISystemStatus]);
*/
  useEffect(() => {
    // Generate a unique ID for the conversation session when the component mounts
    setConversationId(crypto.randomUUID());
  }, []); // The empty array ensures this effect runs only once

  // 3. Update the handleSend function to use the sendMessage function from the hook
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Pass the conversationId along with the user's input
    await sendMessage(input, conversationId); // MODIFIED
    setInput("");
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm h-[60vh] max-h-[500px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50">
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Bot className="text-yellow-400" />
          <h3 className="font-bold text-white">Gertie AI Assistant</h3>
          {/* Optional: Show a status indicator for the AI system */}
          <span
            className={`w-2 h-2 rounded-full ${
              aiStatus === "active"
                ? "bg-green-400"
                : aiStatus === "offline"
                  ? "bg-red-400"
                  : "bg-yellow-400"
            }`}
          ></span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="p-1 rounded-full hover:bg-slate-700"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </header>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.from === "ai" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-xl ${
                msg.from === "ai"
                  ? "bg-slate-700 text-slate-200 rounded-bl-none"
                  : "bg-blue-600 text-white rounded-br-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* 4. Use the 'loading' state from the hook for the typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-200 rounded-xl rounded-bl-none p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about risk, strategy..."
            className="flex-1 bg-transparent p-3 text-slate-200 placeholder-slate-400 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            className="p-3 text-yellow-400 hover:text-yellow-300 disabled:text-slate-500"
            disabled={!input.trim() || loading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
