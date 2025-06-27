import { useEffect, useState } from 'react';
import { useChatStore } from './store/chatStore';
import { useToast } from './hooks/useToast';
import { apiService } from './services/api';
import ThreeBackground from './components/ThreeBackground';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const { loadSessions } = useChatStore();
  const { toasts, removeToast, showError, showSuccess } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load sessions from localStorage on app start
    loadSessions();

    // Check API health
    const checkApiHealth = async () => {
      try {
        const health = await apiService.checkHealth();
        console.log('API Health Check:', health);
        showSuccess('Connected', 'Successfully connected to research assistant');
      } catch (error) {
        console.error('API Health Check Failed:', error);
        showError('Connection Failed', 'Unable to connect to the research assistant. Some features may not work properly.');
      }
    };

    checkApiHealth();
  }, [loadSessions, showError, showSuccess]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <ThreeBackground />
      
      <div className="relative z-10 h-screen flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <ChatPanel onToggleSidebar={toggleSidebar} />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;