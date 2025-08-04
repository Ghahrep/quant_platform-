// src/services/ai/chatService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: FileAttachment[];
  richContent?: RichContent;
  metadata?: {
    model?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  content?: string; // For text files
}

export interface RichContent {
  type: 'chart' | 'table' | 'analysis' | 'portfolio' | 'risk_metrics';
  data: any;
  title?: string;
  description?: string;
}

export interface ChatRequest {
  message: string;
  attachments?: FileAttachment[];
  context?: ChatMessage[];
  options?: {
    includePortfolioData?: boolean;
    analysisType?: 'quick' | 'detailed' | 'comprehensive';
    preferredModel?: string;
  };
}

export interface ChatResponse {
  id: string;
  content: string;
  richContent?: RichContent;
  suggestions?: string[];
  metadata: {
    model: string;
    confidence: number;
    processingTime: number;
    tokens: {
      input: number;
      output: number;
    };
  };
}

class ChatService {
  private baseUrl = '/api/ai';

  // Send a chat message to the AI assistant
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data;
  }

  // Upload and analyze a file
  async uploadFile(file: File): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  }

  // Get chat history
  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return data.messages || [];
  }

  // Clear chat history
  async clearHistory(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/history`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear chat history');
    }
  }

  // Get AI assistant capabilities and status
  async getAssistantStatus(): Promise<{
    available: boolean;
    models: string[];
    capabilities: string[];
    version: string;
  }> {
    const response = await fetch(`${this.baseUrl}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get assistant status');
    }

    return response.json();
  }

  // Generate quick analysis suggestions
  async getAnalysisSuggestions(portfolioData?: any): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ portfolioData }),
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  }

  // Process natural language queries for specific analysis
  async processQuery(query: string, type: 'portfolio' | 'risk' | 'market' | 'optimization'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, type }),
    });

    if (!response.ok) {
      throw new Error('Failed to process query');
    }

    return response.json();
  }
}

export const chatService = new ChatService();

// React Query hooks for AI chat functionality
export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => chatService.getChatHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: () => {
      // Invalidate chat history to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
};

export const useUploadFile = () => {
  return useMutation({
    mutationFn: chatService.uploadFile,
  });
};

export const useAssistantStatus = () => {
  return useQuery({
    queryKey: ['assistantStatus'],
    queryFn: () => chatService.getAssistantStatus(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
  });
};

export const useAnalysisSuggestions = (portfolioData?: any) => {
  return useQuery({
    queryKey: ['analysisSuggestions', portfolioData],
    queryFn: () => chatService.getAnalysisSuggestions(portfolioData),
    enabled: !!portfolioData,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useClearHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatService.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
};

// Utility functions for rich content rendering
export const createChartContent = (
  chartData: any,
  title: string,
  chartType: 'line' | 'bar' | 'pie' | 'scatter' = 'line'
): RichContent => ({
  type: 'chart',
  title,
  data: {
    type: chartType,
    ...chartData,
  },
});

export const createTableContent = (
  headers: string[],
  rows: string[][],
  title: string
): RichContent => ({
  type: 'table',
  title,
  data: {
    headers,
    rows,
  },
});

export const createAnalysisContent = (
  metrics: Record<string, any>,
  recommendations: string[],
  title: string
): RichContent => ({
  type: 'analysis',
  title,
  data: {
    metrics,
    recommendations,
  },
});

export const createPortfolioContent = (
  holdings: any[],
  summary: Record<string, any>,
  title: string
): RichContent => ({
  type: 'portfolio',
  title,
  data: {
    holdings,
    summary,
  },
});

export const createRiskMetricsContent = (
  metrics: Record<string, any>,
  alerts: any[],
  title: string
): RichContent => ({
  type: 'risk_metrics',
  title,
  data: {
    metrics,
    alerts,
  },
});

// Mock data for development (remove when real API is connected)
export const mockChatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const responses = [
      {
        content: "I've analyzed your portfolio and identified several key insights. Your current allocation shows strong tech exposure but could benefit from better diversification.",
        richContent: createAnalysisContent(
          {
            totalValue: 847293,
            dayChange: 12847,
            riskScore: 7.2,
            sharpeRatio: 1.34,
            beta: 1.18,
            volatility: 18.5
          },
          [
            'Consider reducing tech exposure from 68% to 50-55%',
            'Add defensive sectors (utilities, consumer staples)',
            'Increase international diversification to 15-20%',
            'Monitor VaR levels - currently at moderate risk'
          ],
          'Portfolio Analysis Results'
        )
      },
      {
        content: "Based on current market conditions, I recommend adjusting your risk exposure. The VIX is elevated, indicating increased volatility ahead.",
        richContent: createRiskMetricsContent(
          {
            var95: 42000,
            cvar95: 67000,
            beta: 1.18,
            volatility: 18.5,
            maxDrawdown: -12.3,
            correlations: {
              'SPY': 0.85,
              'QQQ': 0.92,
              'VTI': 0.88
            }
          },
          [
            { type: 'warning', message: 'VaR threshold approaching limit' },
            { type: 'info', message: 'Tech sector concentration above 65%' },
            { type: 'critical', message: 'Single position exceeds 15% allocation' }
          ],
          'Current Risk Assessment'
        )
      },
      {
        content: "Your portfolio performance has been strong this quarter. Here's a detailed breakdown of your top holdings and their contribution to returns.",
        richContent: createPortfolioContent(
          [
            { symbol: 'AAPL', weight: 15.2, return: 8.4, contribution: 1.28 },
            { symbol: 'MSFT', weight: 12.8, return: 12.1, contribution: 1.55 },
            { symbol: 'GOOGL', weight: 11.5, return: -2.3, contribution: -0.26 },
            { symbol: 'AMZN', weight: 9.8, return: 15.7, contribution: 1.54 },
            { symbol: 'NVDA', weight: 8.9, return: 22.3, contribution: 1.98 }
          ],
          {
            totalReturn: 6.2,
            benchmarkReturn: 4.8,
            alpha: 1.4,
            trackingError: 3.2,
            informationRatio: 0.44
          },
          'Portfolio Performance Summary'
        )
      },
      {
        content: "Market sentiment analysis shows mixed signals. While fundamentals remain strong, technical indicators suggest caution in the near term.",
        richContent: createChartContent(
          {
            series: [
              {
                name: 'Portfolio Value',
                data: [820000, 835000, 825000, 847000, 852000, 847293],
                color: '#3b82f6'
              },
              {
                name: 'S&P 500 (Normalized)',
                data: [4200, 4250, 4180, 4300, 4320, 4280],
                color: '#10b981'
              }
            ],
            labels: ['5D', '4D', '3D', '2D', '1D', 'Now'],
            yAxisLabel: 'Value ($)',
            xAxisLabel: 'Time Period'
          },
          'Portfolio vs Market Performance',
          'line'
        )
      }
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      id: Date.now().toString(),
      content: randomResponse.content,
      richContent: randomResponse.richContent,
      suggestions: [
        'Run a Monte Carlo simulation',
        'Optimize portfolio allocation',
        'Check sector exposure',
        'Review risk metrics'
      ],
      metadata: {
        model: 'gpt-4-turbo',
        confidence: 0.85 + Math.random() * 0.1,
        processingTime: 1200 + Math.random() * 800,
        tokens: {
          input: 150 + Math.floor(Math.random() * 100),
          output: 300 + Math.floor(Math.random() * 200)
        }
      }
    };
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    return [
      {
        id: '1',
        content: "Hello! I'm Gertie, your AI financial assistant. I can help you with portfolio analysis, risk assessment, market research, and financial modeling. What would you like to explore today?",
        role: 'assistant',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      }
    ];
  },

  async getAssistantStatus() {
    return {
      available: true,
      models: ['gpt-4-turbo', 'claude-3-opus', 'gemini-pro'],
      capabilities: [
        'Portfolio Analysis',
        'Risk Assessment', 
        'Market Research',
        'Financial Modeling',
        'Optimization',
        'Backtesting'
      ],
      version: '2.1.0'
    };
  },

  async getAnalysisSuggestions(portfolioData?: any) {
    return [
      'Analyze current portfolio allocation efficiency',
      'Review risk-adjusted returns vs benchmark',
      'Identify correlation risks in current holdings',
      'Evaluate sector concentration levels',
      'Check rebalancing opportunities',
      'Assess downside protection strategies'
    ];
  }
};