export interface Message {
  role: 'human' | 'ai';
  content: string;
  timestamp: Date;
  isError?: boolean; // For styling error messages
  isLoading?: boolean; // For displaying "Thinking..." bubble specifically
  documentStatus?: string; // To show info about document processing
}

export interface ChatSession {
  session_id: string;
  name: string;
  createdAt: Date;
  messages: Message[];
}

export type LLMProvider = 'deepseek' | 'openai' | 'anthropic' | 'gemini';

// Add more models or update existing ones
export interface LLMModel {
  openai: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';
  anthropic: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
  deepseek: 'deepseek-chat' | 'deepseek-coder'; // Keep these, verify exact backend names
  gemini: 'gemini-1.5-pro-latest' | 'gemini-1.5-flash-latest' | 'gemini-1.0-pro'; // Use latest model names
}

export interface QueryResponse {
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
  filenames: string[];
  extracted_texts: string[];
}


export type Theme = 'light' | 'dark' | 'system';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}