import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Menu } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiService } from '../services/api';
import { useToast } from '../hooks/useToast';
import MessageBubble from './MessageBubble';
import ModelSelector from './ModelSelector';
import FileUpload from './FileUpload';
import { Message, UploadResponse, ChatSession } from '../types'; // Ensure ChatSession is imported
import { handleApiError, UserFriendlyError } from '../utils/errorHandler';

interface ChatPanelProps {
  onToggleSidebar: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onToggleSidebar }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    currentSession,
    selectedProvider,
    selectedModel,
    isLoading,
    setLoading,
    setError,
    createSessionInStore, // Updated store action name
    addMessageToStore,    // Updated store action name
    setCurrentSessionInStore, // Updated store action name
  } = useChatStore();

  const { showError, showSuccess, showWarning } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const addErrorToChat = (sessionId: string, friendlyError: UserFriendlyError) => {
    const errorChatMessage: Message = {
      role: 'ai',
      content: friendlyError.message,
      timestamp: new Date(),
      isError: true,
    };
    addMessageToStore(sessionId, errorChatMessage);
  };

  const ensureSession = async (): Promise<ChatSession | null> => {
    if (currentSession) {
      return currentSession;
    }
    if (isLoading) return null;

    setLoading(true);
    setError(null);
    try {
      const newSessionData = await apiService.createSession();
      const newSession = createSessionInStore(
        newSessionData.session_id,
        `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
      setCurrentSessionInStore(newSession);
      showSuccess('New Session', `Session "${newSession.name}" created.`);
      setLoading(false);
      return newSession;
    } catch (sessionError) {
      const friendlyError = handleApiError(sessionError);
      showError(friendlyError.title, friendlyError.message);
      setLoading(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const activeSession = await ensureSession();
    if (!activeSession) {
      showError("Session Error", "Cannot send message. Please try creating a new session or selecting one.");
      setLoading(false);
      return;
    }

    const query = inputValue.trim();
    setInputValue('');
    setLoading(true);
    setError(null);

    addMessageToStore(activeSession.session_id, { role: 'human', content: query, timestamp: new Date() });

    try {
      const apiResponse = await apiService.submitQuery({
        query,
        sessionId: activeSession.session_id,
        llmProvider: selectedProvider,
        llmModel: selectedModel,
        // embeddingProvider: selectedProvider, // Example: If your API needs it for text queries
        // documentUrl: undefined,             // Example
        // summarizeDocument: false,           // Example
      });

      addMessageToStore(activeSession.session_id, {
        role: 'ai',
        content: apiResponse.response,
        timestamp: new Date(),
      });

    } catch (queryError) {
      const friendlyError = handleApiError(queryError);
      showError(friendlyError.title, friendlyError.message);
      addErrorToChat(activeSession.session_id, friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && currentSession) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUploadComplete = (uploadApiResponse: UploadResponse) => {
    if (!currentSession) {
      showError("Upload Error", "No active session to associate file results with.");
      return;
    }

    let overallStatusChatMessage = "";
    let isOverallError = false; // To style the summary message as error if any file failed

    if (uploadApiResponse && Array.isArray(uploadApiResponse.filenames) && Array.isArray(uploadApiResponse.extracted_texts)) {
      const numProcessedFiles = uploadApiResponse.filenames.length;

      if (numProcessedFiles > 0) {
        overallStatusChatMessage = `Successfully processed ${numProcessedFiles} file(s): ${uploadApiResponse.filenames.join(', ')}.`;
        showSuccess("Files Processed", `${numProcessedFiles} document(s) are ready for querying.`);

        // Add the overall status message first
        addMessageToStore(currentSession.session_id, {
          role: 'ai',
          content: overallStatusChatMessage + " Snippets of extracted content (if any) are shown below.",
          timestamp: new Date(),
        });

        // Then, add individual snippets as separate messages
        const snippetMaxLength = 250; // Max length for each snippet
        uploadApiResponse.filenames.forEach((filename, index) => {
          const text = uploadApiResponse.extracted_texts[index];
          let snippetContent = "Could not extract text from this file, or the file was empty.";
          if (text && text.trim() !== "") {
            snippetContent = `"${text.substring(0, snippetMaxLength)}${text.length > snippetMaxLength ? '...' : ''}"`;
          }
          
          addMessageToStore(currentSession.session_id, {
            role: 'ai', // Display as an informative AI message
            content: `📄 **${filename}**: ${snippetContent}`,
            timestamp: new Date(),
            documentStatus: `Processed: ${filename}` // Example detailed status
          });
        });
        // No need to return here, the overall message is handled below if snippets aren't added

      } else { // API call succeeded, but backend reported no files were processed successfully.
        overallStatusChatMessage = "File upload submitted, but no files were processed by the backend. This might happen if files were empty or of unsupported types not caught by initial checks.";
        showWarning("Upload Info", "No files appear to have been processed successfully by the backend.");
        isOverallError = true; // Treat as a soft error/warning for the chat message
        addMessageToStore(currentSession.session_id, {
            role: 'ai',
            content: overallStatusChatMessage,
            timestamp: new Date(),
            isError: isOverallError,
        });
      }
    } else {
      // This implies an unexpected response structure from the API.
      overallStatusChatMessage = "There was an issue with the file upload process or the server returned an unexpected response. Please check notifications or try again.";
      showError("Upload Error", "Unexpected response from file upload service.");
      isOverallError = true;
      addMessageToStore(currentSession.session_id, {
          role: 'ai',
          content: overallStatusChatMessage,
          timestamp: new Date(),
          isError: isOverallError,
      });
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
      {/* Header */}
      <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
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
                  : (
                    <button onClick={ensureSession} className="hover:underline disabled:opacity-50" disabled={isLoading}>
                      Start new chat
                    </button>
                  )
                }
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <ModelSelector />
          </div>
        </div>
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
                  Research Assistant Ready
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm sm:text-base">
                  <button onClick={ensureSession} className="text-blue-600 dark:text-blue-400 hover:underline font-medium" disabled={isLoading}>
                    Start a new chat
                  </button>
                  {' '}or select one from the sidebar. Upload documents to begin.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {currentSession.messages.map((message, index) => (
              <MessageBubble
                key={`${currentSession.session_id}-${index}-${message.timestamp.toISOString()}`}
                message={message}
              />
            ))}
            {/* Loading indicator if isLoading and last message was human (AI is "thinking") */}
            {isLoading && currentSession.messages.length > 0 &&
             currentSession.messages[currentSession.messages.length - 1]?.role === 'human' && (
              <MessageBubble
                message={{
                  role: 'ai',
                  content: 'Thinking...', // Standard thinking message
                  timestamp: new Date(),
                  isLoading: true, // Prop for MessageBubble to style as loading
                }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
        <FileUpload
          currentSessionId={currentSession?.session_id}
          onUploadComplete={handleFileUploadComplete}
        />
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentSession ? "Type your research query or ask about documents..." : "Please start or select a session to chat."}
              className="w-full px-4 py-3 pr-12 sm:pr-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none min-h-[52px] max-h-32 text-sm sm:text-base custom-scrollbar"
              disabled={isLoading || !currentSession} // Disable if no session or loading
              rows={1}
              aria-label="Chat input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !currentSession} // Disable if no session, no input, or loading
              className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 p-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              aria-label="Send message"
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
          Shift+Enter for new line.
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;