import { create } from 'zustand';
import { ChatSession, Message, LLMProvider, LLMModel } from '../types';

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  selectedProvider: LLMProvider;
  selectedModel: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSessions: (sessions: ChatSession[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  setSelectedProvider: (provider: LLMProvider) => void;
  setSelectedModel: (model: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Session management
  createSession: (name?: string) => ChatSession;
  addMessage: (sessionId: string, message: Message) => void;
  updateSession: (session: ChatSession) => void;
  deleteOldestSession: () => void;
  
  // Local storage
  loadSessions: () => void;
  saveSessions: () => void;
}

const MODEL_OPTIONS: Record<LLMProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet'],
  deepseek: ['deepseek-coder', 'deepseek-chat'],
  gemini: ['gemini-1.5-pro', 'gemini-1.0-pro']
};

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  selectedProvider: 'openai',
  selectedModel: 'gpt-4o',
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setSelectedProvider: (provider) => {
    const models = MODEL_OPTIONS[provider];
    set({ 
      selectedProvider: provider, 
      selectedModel: models[0] 
    });
  },
  setSelectedModel: (model) => set({ selectedModel: model }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  createSession: (name) => {
    const now = new Date();
    const defaultName = name || `Chat - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    
    const newSession: ChatSession = {
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: defaultName,
      createdAt: now,
      messages: []
    };

    const { sessions } = get();
    const updatedSessions = [newSession, ...sessions];
    
    // Remove oldest if we have more than 10
    if (updatedSessions.length > 10) {
      updatedSessions.pop();
    }
    
    set({ sessions: updatedSessions, currentSession: newSession });
    get().saveSessions();
    
    return newSession;
  },

  addMessage: (sessionId, message) => {
    const { sessions } = get();
    const updatedSessions = sessions.map(session => {
      if (session.session_id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, message]
        };
      }
      return session;
    });
    
    set({ sessions: updatedSessions });
    
    // Update current session if it matches
    const { currentSession } = get();
    if (currentSession?.session_id === sessionId) {
      const updatedCurrentSession = updatedSessions.find(s => s.session_id === sessionId);
      set({ currentSession: updatedCurrentSession || null });
    }
    
    get().saveSessions();
  },

  updateSession: (updatedSession) => {
    const { sessions } = get();
    const updatedSessions = sessions.map(session =>
      session.session_id === updatedSession.session_id ? updatedSession : session
    );
    
    set({ sessions: updatedSessions });
    
    // Update current session if it matches
    const { currentSession } = get();
    if (currentSession?.session_id === updatedSession.session_id) {
      set({ currentSession: updatedSession });
    }
    
    get().saveSessions();
  },

  deleteOldestSession: () => {
    const { sessions } = get();
    if (sessions.length > 0) {
      const updatedSessions = sessions.slice(0, -1);
      set({ sessions: updatedSessions });
      get().saveSessions();
    }
  },

  loadSessions: () => {
    try {
      const stored = localStorage.getItem('chat-sessions');
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        set({ sessions });
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
    }
  },

  saveSessions: () => {
    try {
      const { sessions } = get();
      localStorage.setItem('chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }
}));