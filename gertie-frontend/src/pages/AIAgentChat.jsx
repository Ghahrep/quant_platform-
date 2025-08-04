import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Send } from "lucide-react";

export const AIAgentChat = ({ isChatOpen, setChatOpen }) => {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm Gertie, your AI risk companion. How can I help you analyze your portfolio today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Mock API call to the orchestrator
    setTimeout(() => {
      setIsTyping(false);
      // This is where you would call:
      // fetch('/api/v1/ai/orchestrator/query', { method: 'POST', body: JSON.stringify({ query: input }) })
      // And then process the response.
      const responses = [
        `Based on current market conditions, your portfolio shows moderate risk levels. The Hurst exponent of 0.42 indicates mean-reverting behavior.`,
        `I've analyzed your query about "${input.slice(0, 30)}...". Your VaR is currently $25,400, which is within acceptable bounds.`,
        `Looking at your risk metrics, I recommend maintaining your current allocation with a slight increase in cash reserves.`,
        `Your portfolio performance has been steady. The GARCH model suggests volatility may increase in the coming weeks.`,
      ];
      const aiResponse = {
        from: "ai",
        text: responses[Math.floor(Math.random() * responses.length)],
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1200);
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm h-[60vh] max-h-[500px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50">
      <header className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Bot className="text-yellow-400" />
          <h3 className="font-bold text-white">Gertie AI Assistant</h3>
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
        {isTyping && (
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
            disabled={isTyping}
          />
          <button
            type="submit"
            className="p-3 text-yellow-400 hover:text-yellow-300 disabled:text-slate-500"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
