// src/types/chat/chat.ts

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  insight?: ChatInsight;
  quickActions?: QuickAction[];
}

export interface ChatInsight {
  title: string;
  description: string;
  action: string;
  data?: Record<string, any>;
}

export interface QuickAction {
  label: string;
  action: string;
  agent?: string;
  icon?: string;
}
