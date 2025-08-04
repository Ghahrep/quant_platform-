// src/services/api/aiAssistantApi.ts
import { apiClient, BaseResponse } from './client';

// AI Assistant Data Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    model: string;
    tokens: number;
    confidence: number;
    processing_time_ms: number;
  };
}

export interface ChatSession {
  session_id: string;
  created_at: string;
  last_activity: string;
  message_count: number;
  title?: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  context?: {
    page: string;
    data?: Record<string, any>;
  };
  options?: {
    temperature?: number;
    max_tokens?: number;
    include_portfolio_context?: boolean;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  session_id: string;
  suggestions?: string[];
  actions?: {
    type: 'OPEN_PAGE' | 'RUN_ANALYSIS' | 'EXPORT_DATA';
    payload: Record<string, any>;
    description: string;
  }[];
}

export interface QuickAction {
  id: string;
  category: 'analysis' | 'portfolio' | 'risk' | 'market';
  title: string;
  description: string;
  prompt: string;
  icon: string;
}

// AI Assistant API Class
export class AIAssistantAPI {
  // Send chat message
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/v1/ai/chat', request);
    return response.data!;
  }

  // Get chat history
  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/api/v1/ai/chat/${sessionId}/history`, {
      limit
    });
    return response.data!;
  }

  // Create new chat session
  async createSession(title?: string): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>('/api/v1/ai/sessions', { title });
    return response.data!;
  }

  // Get user's chat sessions
  async getSessions(limit: number = 20): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>('/api/v1/ai/sessions', { limit });
    return response.data!;
  }

  // Delete chat session
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/api/v1/ai/sessions/${sessionId}`);
  }

  // Get quick actions
  async getQuickActions(): Promise<QuickAction[]> {
    const response = await apiClient.get<QuickAction[]>('/api/v1/ai/quick-actions');
    return response.data!;
  }

  // Get AI assistant status
  async getStatus(): Promise<{
    status: 'online' | 'offline' | 'maintenance';
    model: string;
    capabilities: string[];
    response_time_ms: number;
  }> {
    const response = await apiClient.get('/api/v1/ai/status');
    return response.data!;
  }

  // Rate a response
  async rateResponse(messageId: string, rating: 'positive' | 'negative', feedback?: string): Promise<void> {
    await apiClient.post(`/api/v1/ai/messages/${messageId}/rate`, {
      rating,
      feedback
    });
  }

  // Export chat session
  async exportChat(sessionId: string, format: 'json' | 'txt' | 'pdf' = 'json'): Promise<Blob> {
    const response = await fetch(`${apiClient['baseURL']}/api/v1/ai/chat/${sessionId}/export?format=${format}`, {
      headers: apiClient['headers']
    });
    return response.blob();
  }
}

// Create singleton instance
export const aiAssistantApi = new AIAssistantAPI();

// React Query hooks for AI Assistant
export const aiAssistantQueries = {
  // Chat history
  chatHistory: (sessionId: string, limit: number = 50) => ({
    queryKey: ['ai', 'chat', sessionId, limit],
    queryFn: () => aiAssistantApi.getChatHistory(sessionId, limit),
    staleTime: 10000, // 10 seconds
    enabled: !!sessionId,
  }),

  // User sessions
  sessions: (limit: number = 20) => ({
    queryKey: ['ai', 'sessions', limit],
    queryFn: () => aiAssistantApi.getSessions(limit),
    staleTime: 60000, // 1 minute
  }),

  // Quick actions
  quickActions: () => ({
    queryKey: ['ai', 'quick-actions'],
    queryFn: () => aiAssistantApi.getQuickActions(),
    staleTime: 3600000, // 1 hour
  }),

  // AI status
  status: () => ({
    queryKey: ['ai', 'status'],
    queryFn: () => aiAssistantApi.getStatus(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Check every minute
  }),
};

// Mutation hooks for AI interactions
export const aiAssistantMutations = {
  sendMessage: (request: ChatRequest) => aiAssistantApi.sendMessage(request),
  createSession: (title?: string) => aiAssistantApi.createSession(title),
  deleteSession: (sessionId: string) => aiAssistantApi.deleteSession(sessionId),
  rateResponse: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => 
    aiAssistantApi.rateResponse(messageId, rating, feedback),
};

// Default quick actions (fallback if API unavailable)
export const defaultQuickActions: QuickAction[] = [
  {
    id: '1',
    category: 'risk',
    title: 'Portfolio Risk Analysis',
    description: 'Analyze current portfolio risk metrics',
    prompt: 'Please analyze my current portfolio risk metrics and provide insights on potential vulnerabilities.',
    icon: '📊'
  },
  {
    id: '2',
    category: 'market',
    title: 'Market Outlook',
    description: 'Current market conditions assessment',
    prompt: 'What is your assessment of current market conditions and potential risks to watch?',
    icon: '🌍'
  },
  {
    id: '3',
    category: 'portfolio',
    title: 'Asset Allocation',
    description: 'Optimize portfolio allocation',
    prompt: 'Suggest improvements to my current asset allocation based on modern portfolio theory.',
    icon: '⚖️'
  },
  {
    id: '4',
    category: 'analysis',
    title: 'VaR Analysis',
    description: 'Value at Risk calculation help',
    prompt: 'Explain Value at Risk calculation and help me interpret my current VaR metrics.',
    icon: '📈'
  },
  {
    id: '5',
    category: 'risk',
    title: 'Stress Testing',
    description: 'Portfolio stress test guidance',
    prompt: 'Guide me through stress testing my portfolio against various market scenarios.',
    icon: '🧪'
  },
  {
    id: '6',
    category: 'analysis',
    title: 'Correlation Analysis',
    description: 'Portfolio correlation insights',
    prompt: 'Analyze the correlation structure of my portfolio holdings and identify concentration risks.',
    icon: '🔗'
  }
];

// Utility functions
export const formatMessageTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'analysis': return '📊';
    case 'portfolio': return '⚖️';
    case 'risk': return '🛡️';
    case 'market': return '🌍';
    default: return '💬';
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'analysis': return 'bg-blue-100 text-blue-700';
    case 'portfolio': return 'bg-green-100 text-green-700';
    case 'risk': return 'bg-red-100 text-red-700';
    case 'market': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};