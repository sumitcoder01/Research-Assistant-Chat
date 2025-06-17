import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Menu } from 'lucide-react';
import { useChatStore } from '../store/chatStore'; 
import { apiService } from '../services/api';     
import { useToast } from '../hooks/useToast';   
import MessageBubble from './MessageBubble';        
import ModelSelector from './ModelSelector';     
import FileUpload from './FileUpload';          
import { Message, LLMProvider } from '../types';    

interface ChatPanelProps {
  onToggleSidebar: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onToggleSidebar }) => {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    currentSession,
    selectedProvider,
    selectedModel,
    isLoading,
    setLoading,
    error,
    setError,
    createSession,
    addMessage,
    setCurrentSession
  } = useChatStore();

  const { showError, showSuccess } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      // Create session if none exists
      let sessionToUse = currentSession;
      if (!sessionToUse) {
        sessionToUse = createSession();
        setCurrentSession(sessionToUse);
      }

      if (!sessionToUse) {
        showError('Session Error', 'Could not initialize chat session.');
        setLoading(false);
        return;
      }

      // Add user message
      const userMessage: Message = {
        role: 'human',
        content: query,
        timestamp: new Date()
      };
      addMessage(sessionToUse.session_id, userMessage);

      // Submit query to API
      const response = await apiService.submitQuery(
        query,
        sessionToUse.session_id,
        selectedProvider
      );

      // Add AI response
      const aiMessage: Message = {
        role: 'ai',
        content: response.response,
        timestamp: new Date()
      };
      addMessage(sessionToUse.session_id, aiMessage);

    } catch (error) {
      console.error('🔴 Query submission failed:', error);
      
      // Use the error handler to get user-friendly message
      const { handleApiError } = await import('../utils/errorHandler');
      const friendlyError = handleApiError(error);
      
      // Show user-friendly error in toast
      showError(friendlyError.title, friendlyError.message);
      
      // Add user-friendly error message to chat
      if (currentSession) {
        const errorChatMessage: Message = {
          role: 'ai',
          content: `I apologize, but I encountered an issue while processing your request: ${friendlyError.message}\n\nPlease try again, and if the problem persists, try rephrasing your query or refreshing the page.`,
          timestamp: new Date()
        };
        addMessage(currentSession.session_id, errorChatMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUploadComplete = (filenames: string[]) => {
    setUploadedFiles(prev => [...prev, ...filenames]);
    
    // Add a message about uploaded files
    if (currentSession) {
      const uploadMessage: Message = {
        role: 'ai',
        content: `Successfully uploaded ${filenames.length} file(s): ${filenames.join(', ')}. These documents are now available for your research queries.`,
        timestamp: new Date()
      };
      addMessage(currentSession.session_id, uploadMessage);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
      {/* Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentSession ? currentSession.name : 'AI Research Assistant'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentSession 
                  ? `${currentSession.messages.length} messages`
                  : 'Select a chat or start a new conversation'
                }
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <ModelSelector />
          </div>
        </div>
        
        {/* Mobile Model Selector */}
        <div className="sm:hidden mt-3">
          <ModelSelector />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {!currentSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Send className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to AI Research Assistant
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm sm:text-base">
                  Start a conversation by typing a message below, or create a new chat session from the sidebar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {currentSession.messages.map((message, index) => (
              <MessageBubble
                key={`${currentSession.session_id}-${index}`}
                message={message}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>
                <div className="max-w-full sm:max-w-4xl">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
        {/* File Upload */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <FileUpload 
            currentSessionId={currentSession?.session_id} 
            onUploadComplete={handleFileUploadComplete} 
          />
          {uploadedFiles.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {uploadedFiles.length} file(s) uploaded
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your research query..."
              className="w-full px-4 py-3 pr-12 sm:pr-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none min-h-[52px] max-h-32 text-sm sm:text-base custom-scrollbar"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 p-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;