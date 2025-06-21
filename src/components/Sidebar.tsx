import React, { useState } from 'react';
import { Plus, MessageCircle, Calendar, X, Loader2, Trash2 } from 'lucide-react'; // Added Loader2 and Trash2
import { useChatStore } from '../store/chatStore';
import { apiService } from '../services/api'; // Import apiService
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';
import { ChatSession } from '../types'; // Import ChatSession type
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    sessions,
    currentSession,
    setCurrentSessionInStore, // Use renamed store action
    createSessionInStore,   // Use renamed store action
    deleteSessionFromStore, // Use new store action
    isLoading,              // Use loading state from store
    setLoading,             // Use loading state from store
  } = useChatStore();

  const { showError, showSuccess } = useToast();
  
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleCreateSession = async () => {
    if (isLoading) return; // Prevent multiple requests

    setLoading(true);
    try {
      // 1. Call API to create the session on the backend
      const newSessionData = await apiService.createSession();

      // 2. Use the backend-provided ID to create the session in the local store
      const sessionName = newSessionName.trim() || undefined; // Use user input or let store create default
      const newLocalSession = createSessionInStore(newSessionData.session_id, sessionName);

      // 3. Set the new session as the current one
      setCurrentSessionInStore(newLocalSession);

      showSuccess("New Session", `Session "${newLocalSession.name}" created successfully.`);

    } catch (error) {
      // Use your error handler for a user-friendly message
      const { handleApiError } = await import('../utils/errorHandler');
      const friendlyError = handleApiError(error);
      showError(friendlyError.title, friendlyError.message);
    } finally {
      // Reset state regardless of success or failure
      setLoading(false);
      setShowNameDialog(false);
      setNewSessionName('');
    }

    // Close sidebar on mobile after creating session
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSessionClick = (session: ChatSession) => { // Use ChatSession type
    setCurrentSessionInStore(session); // Use renamed store action
    
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent handleSessionClick from firing
    // Optional: Add a confirmation dialog
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      deleteSessionFromStore(sessionId);
      showSuccess("Session Deleted", "The chat session has been removed.");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-80 sm:w-96 lg:w-80 xl:w-96
        bg-white/90 dark:bg-gray-900/90 backdrop-blur-md 
        border-r border-gray-200/50 dark:border-gray-700/50 
        flex flex-col h-full shadow-2xl lg:shadow-lg
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Research Assistant
              </h2>
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={() => setShowNameDialog(true)}
            disabled={isLoading || showNameDialog} // Disable if loading or dialog is open
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg group disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading && showNameDialog ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            )}
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No chat sessions yet</p>
              <p className="text-xs mt-1">Click "New Chat" to get started</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => handleSessionClick(session)}
                className={`relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 border group ${
                  currentSession?.session_id === session.session_id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md'
                    : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageCircle 
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                      currentSession?.session_id === session.session_id 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{format(session.createdAt, 'MMM d, HH:mm')}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.session_id)}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete chat session: ${session.name}`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Session Dialog */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" id="dialog-title">
              Create New Chat Session
            </h3>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Enter chat name (optional)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              onKeyPress={(e) => !isLoading && e.key === 'Enter' && handleCreateSession()}
              disabled={isLoading}
              autoFocus
              aria-labelledby="dialog-title"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNameDialog(false)}
                className="flex-1 px-4 py-2.5 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Leave empty for auto-generated name
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;