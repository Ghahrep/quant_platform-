import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Paperclip, MoreVertical, Bot, User, Loader2, AlertCircle, RefreshCw, Copy, ThumbsUp, ThumbsDown, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  metadata?: {
    tokens?: number;
    model?: string;
    confidence?: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'analysis' | 'portfolio' | 'risk' | 'market';
}

interface ChatState {
  messages: Message[];
  currentMessage: string;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  sessionId: string;
}

export const AIAssistant: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: '👋 Hi! I\'m your AI Risk Management Assistant. I can help you with portfolio analysis, risk assessment, market insights, and financial modeling. What would you like to explore today?',
        timestamp: new Date(),
        metadata: { model: 'claude-sonnet-4', confidence: 0.95 }
      }
    ],
    currentMessage: '',
    isLoading: false,
    isTyping: false,
    error: null,
    sessionId: crypto.randomUUID()
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick Actions for common requests
  const quickActions: QuickAction[] = [
    {
      id: '1',
      label: 'Analyze Portfolio Risk',
      prompt: 'Please analyze the current portfolio risk metrics and provide insights on potential vulnerabilities.',
      icon: '📊',
      category: 'risk'
    },
    {
      id: '2',
      label: 'Market Outlook',
      prompt: 'What is your assessment of current market conditions and potential risks to watch?',
      icon: '🌍',
      category: 'market'
    },
    {
      id: '3',
      label: 'Optimize Asset Allocation',
      prompt: 'Suggest improvements to my current asset allocation based on modern portfolio theory.',
      icon: '⚖️',
      category: 'portfolio'
    },
    {
      id: '4',
      label: 'VaR Analysis',
      prompt: 'Explain Value at Risk calculation and help me interpret my current VaR metrics.',
      icon: '📈',
      category: 'analysis'
    },
    {
      id: '5',
      label: 'Stress Testing',
      prompt: 'Guide me through stress testing my portfolio against various market scenarios.',
      icon: '🧪',
      category: 'risk'
    },
    {
      id: '6',
      label: 'Correlation Analysis',
      prompt: 'Analyze the correlation structure of my portfolio holdings and identify concentration risks.',
      icon: '🔗',
      category: 'analysis'
    }
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, scrollToBottom]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [chatState.currentMessage, adjustTextareaHeight]);

  // Simulate AI response with realistic delay and typing indicator
  const simulateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Add typing indicator
    setChatState(prev => ({ ...prev, isTyping: true }));
    
    // Simulate processing delay (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate contextual response based on message content
    const lowercaseMessage = userMessage.toLowerCase();
    
    if (lowercaseMessage.includes('risk') || lowercaseMessage.includes('var')) {
      return `Based on your portfolio analysis, I can see several key risk factors to consider:

**Current Risk Metrics:**
- Portfolio VaR (95%): $42,156 daily potential loss
- Beta: 1.08 (slightly more volatile than market)
- Maximum Drawdown: -12.3% over the last 12 months

**Key Observations:**
- Your technology sector allocation (35%) creates concentration risk
- Low correlation with fixed income suggests good diversification opportunities
- Current Sharpe ratio of 1.42 indicates strong risk-adjusted returns

**Recommendations:**
1. Consider reducing tech exposure to under 25%
2. Add defensive assets during high volatility periods
3. Implement dynamic hedging strategies

Would you like me to elaborate on any of these areas or run a specific stress test scenario?`;
    }
    
    if (lowercaseMessage.includes('portfolio') || lowercaseMessage.includes('allocation')) {
      return `Let me analyze your current portfolio allocation and suggest optimizations:

**Current Allocation Analysis:**
- Equities: 70% (slightly aggressive for current market conditions)
- Fixed Income: 20% (consider increasing to 25-30%)
- Alternatives: 10% (good diversification)

**Efficiency Metrics:**
- Current portfolio sits 2.3% below the efficient frontier
- Opportunity to improve returns by 0.8% annually with same risk level
- Correlation matrix shows some redundant positions

**Optimization Suggestions:**
1. **Rebalance Sectors:** Reduce tech (35%→25%), increase utilities/consumer staples
2. **Geographic Diversification:** Add 5-10% emerging markets exposure
3. **Factor Tilts:** Consider small-cap value tilt for enhanced returns

**Implementation Strategy:**
- Phase changes over 3-6 months to minimize market impact
- Use tax-loss harvesting opportunities
- Consider ETFs for cost-efficient exposure

Would you like me to generate a specific rebalancing plan or model different scenarios?`;
    }
    
    if (lowercaseMessage.includes('market') || lowercaseMessage.includes('outlook')) {
      return `Here's my current market assessment based on multiple risk indicators:

**Market Regime Analysis:**
- **Current State:** Late-cycle expansion with elevated volatility
- **Risk Level:** MODERATE-HIGH (up from MODERATE last month)
- **Primary Concerns:** Inflation persistence, geopolitical tensions

**Key Indicators:**
- VIX: 18.5 (approaching elevated levels)
- Credit spreads: Widening in high-yield (+15 bps this month)
- Yield curve: Slight inversion in 2y-10y (-0.08%)

**Sector Outlook:**
- **Defensive:** Healthcare, Utilities showing relative strength
- **Cyclical:** Technology facing headwinds from rates
- **Commodities:** Energy and materials benefiting from supply constraints

**Risk Scenarios to Monitor:**
1. **Central Bank Policy Error** (30% probability)
2. **Geopolitical Escalation** (25% probability)  
3. **Credit Market Stress** (20% probability)

**Recommended Actions:**
- Increase cash/short-term bonds to 10-15%
- Add portfolio insurance via put options
- Consider defensive sector rotation

What specific market scenario would you like me to model for your portfolio?`;
    }
    
    if (lowercaseMessage.includes('help') || lowercaseMessage.includes('how')) {
      return `I'm here to help with all aspects of portfolio and risk management! Here's what I can assist you with:

**📊 Risk Analysis**
- Value at Risk (VaR) and Conditional VaR calculations
- Stress testing and scenario analysis
- Correlation and concentration risk assessment
- Maximum drawdown analysis

**⚖️ Portfolio Optimization**
- Modern Portfolio Theory applications
- Efficient frontier analysis
- Asset allocation recommendations
- Rebalancing strategies

**🌍 Market Intelligence**
- Economic regime analysis
- Sector and geographic allocation insights
- Factor exposure analysis
- Market outlook and scenario planning

**🔧 Technical Tools**
- Fractional Brownian Motion modeling
- GARCH volatility forecasting
- Monte Carlo simulations
- Options strategy analysis

**💡 Quick Tips:**
- Use specific questions for detailed analysis
- Ask for step-by-step explanations of complex concepts
- Request custom scenarios based on your portfolio
- Get help interpreting any metrics or charts

What would you like to explore first?`;
    }
    
    // Default intelligent response
    return `I understand you're asking about "${userMessage}". Let me help you with that.

This is a simulated response that would normally connect to our AI orchestrator backend. In production, I would:

1. **Analyze your query** using natural language processing
2. **Access relevant portfolio data** from our database
3. **Run sophisticated models** (GARCH, Monte Carlo, etc.)
4. **Provide actionable insights** with supporting visualizations

For now, I can help you explore our platform features:
- Try the Portfolio Optimizer for efficient frontier analysis
- Use the Analytics page for advanced risk modeling
- Check out the fBm Simulator for market behavior insights

Would you like me to guide you to any specific tool or explain a particular concept in detail?`;
  }, []);

  // Handle sending messages
  const sendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || chatState.currentMessage.trim();
    if (!textToSend || chatState.isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      currentMessage: '',
      isLoading: true,
      error: null
    }));

    try {
      const response = await simulateAIResponse(textToSend);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: {
          model: 'claude-sonnet-4',
          tokens: response.length * 0.75, // Approximate
          confidence: 0.85 + Math.random() * 0.1
        }
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        isTyping: false
      }));

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: 'Failed to get AI response. Please try again.',
        isLoading: false,
        isTyping: false
      }));
    }
  }, [chatState.currentMessage, chatState.isLoading, simulateAIResponse]);

  // Handle quick action clicks
  const handleQuickAction = useCallback((action: QuickAction) => {
    sendMessage(action.prompt);
  }, [sendMessage]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatState(prev => ({ ...prev, currentMessage: e.target.value }));
  }, []);

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Copy message content
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    // Could add toast notification here
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [prev.messages[0]], // Keep welcome message
      sessionId: crypto.randomUUID()
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">AI Risk Assistant</h1>
            <p className="text-sm text-slate-600">
              Powered by Claude Sonnet 4 • {chatState.isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConversation}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            title="Clear conversation"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {chatState.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-4xl ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl max-w-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                  
                  {/* Message Actions */}
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        className="p-1 text-slate-400 hover:text-green-600 transition-colors duration-200"
                        title="Good response"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors duration-200"
                        title="Poor response"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.metadata && (
                    <>
                      <span>•</span>
                      <span>{message.metadata.model}</span>
                      {message.metadata.confidence && (
                        <>
                          <span>•</span>
                          <span>{Math.round(message.metadata.confidence * 100)}% confidence</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {chatState.isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-4xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {chatState.error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{chatState.error}</span>
              <button
                onClick={() => setChatState(prev => ({ ...prev, error: null }))}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {chatState.messages.length <= 1 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-white">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center space-x-3 p-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200 border border-slate-200"
              >
                <span className="text-lg">{action.icon}</span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{action.label}</div>
                  <div className="text-xs text-slate-600 capitalize">{action.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          {/* Attachment Button */}
          <button className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200">
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={chatState.currentMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about portfolio risk, market analysis, optimization strategies..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
              rows={1}
              disabled={chatState.isLoading}
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-3 text-xs text-slate-400">
              {chatState.currentMessage.length}/2000
            </div>
          </div>

          {/* Voice Input Button */}
          <button className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200">
            <Mic className="h-5 w-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            disabled={!chatState.currentMessage.trim() || chatState.isLoading}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {chatState.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Input Helper Text */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <div className="flex items-center space-x-4">
            <span>Powered by Claude Sonnet 4</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

