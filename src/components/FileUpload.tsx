import React, { useRef, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiService } from '../services/api';
import { useToast } from '../hooks/useToast';

interface FileUploadProps {
  onUploadComplete?: (filenames: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const { currentSession, selectedProvider } = useChatStore();
  const { showError, showSuccess } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!currentSession) {
      showError('Session Required', 'Please create or select a chat session first');
      return;
    }

    setUploadingFiles(files);
    setUploadStatus('uploading');

    try {
      const result = await apiService.uploadDocuments(
        currentSession.session_id,
        selectedProvider,
        files
      );
      
      setUploadStatus('success');
      showSuccess('Upload Successful', `Successfully uploaded ${result.filenames.length} file(s)`);
      onUploadComplete?.(result.filenames);
      
      // Clear after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadingFiles([]);
      }, 3000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      showError('Upload Failed', error instanceof Error ? error.message : 'Failed to upload files');
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadingFiles.length === 1) {
      setUploadStatus('idle');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Upload successful!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Upload files';
    }
  };

  const getButtonColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300';
      default:
        return 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFilesChange}
        className="hidden"
      />
      
      <button
        onClick={handleFileSelect}
        disabled={uploadStatus === 'uploading'}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${getButtonColor()}`}
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
        <span className="sm:hidden">Upload</span>
      </button>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
          {uploadingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <File className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{file.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              {uploadStatus !== 'uploading' && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;