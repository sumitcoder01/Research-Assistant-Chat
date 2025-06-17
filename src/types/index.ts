export interface Message {
    role: 'human' | 'ai';
    content: string;
    timestamp: Date;
  }
  
  export interface ChatSession {
    session_id: string;
    name: string;
    createdAt: Date;
    messages: Message[];
  }
  
  export type LLMProvider = 'deepseek' | 'openai' | 'anthropic' | 'gemini';
  
  export interface LLMModel {
    openai: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo';
    anthropic: 'claude-3-opus' | 'claude-3-sonnet';
    deepseek: 'deepseek-chat' | 'deepseek-coder';
    gemini: 'gemini-2.0-flash' | 'gemini-2.0-pro';
  }
  
  export interface ApiResponse {
    session_id: string;
    query: string;
    response: string;
    debug_info?: any;
  }
  
  export interface SessionHistoryResponse {
    session_id: string;
    history: Array<{
      role: 'human' | 'ai';
      content: string;
    }>;
  }
  
  export interface UploadResponse {
    extracted_texts: string[];
    filenames: string[];
  }
  
  export type Theme = 'light' | 'dark' | 'system';
  
  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }