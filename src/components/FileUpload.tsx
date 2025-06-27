import React, { useRef, useState } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../hooks/useToast';
import { UploadResponse } from '../types'; 
import { handleFileUploadError } from '../utils/errorHandler';

interface FileUploadProps {
  currentSessionId: string | undefined;
  onUploadComplete?: (response: UploadResponse) => void; // Changed to pass UploadResponse
}

const FileUpload: React.FC<FileUploadProps> = ({ currentSessionId, onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFilesUI, setSelectedFilesUI] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallUploadStatus, setOverallUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { showError, showSuccess } = useToast(); // Removed showWarning for simplicity with this response

  const handleFileSelectTrigger = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!currentSessionId) {
      showError('Session Required', 'Please create or select a chat session first to upload files.');
      if (event.target) event.target.value = '';
      return;
    }

    setSelectedFilesUI(files);
    setIsUploading(true);
    setOverallUploadStatus('idle');

    try {
      const embeddingProviderForUpload: string = 'google';

      // apiService.uploadDocuments now returns your UploadResponse directly
      const uploadApiResponse = await apiService.uploadDocuments(
        currentSessionId,
        files,
        embeddingProviderForUpload
      );

      // Check if filenames array exists and has items for success
      if (uploadApiResponse && uploadApiResponse.filenames && uploadApiResponse.filenames.length > 0) {
        setOverallUploadStatus('success');
        showSuccess('Upload Successful', `Processed ${uploadApiResponse.filenames.length} file(s).`);
        onUploadComplete?.(uploadApiResponse); // Pass the whole response
      } else if (uploadApiResponse && uploadApiResponse.filenames && uploadApiResponse.filenames.length === 0 && files.length > 0) {
        // API call succeeded but no files were processed (e.g., all unsupported type by backend)
        setOverallUploadStatus('error'); // Or a different status like 'no_files_processed'
        showError('Upload Info', 'No files were processed. Check file types or backend logs.');
        onUploadComplete?.({ filenames: [], extracted_texts: [] }); // Send empty success
      } else {
        // This case implies an unexpected response structure from the API
        throw new Error("Upload completed but received an unexpected response format from the server.");
      }

    } catch (error) {
      console.error('Upload failed in FileUpload component:', error);
      setOverallUploadStatus('error');
      const friendlyError = handleFileUploadError(error); // handleFileUploadError now more relevant
      showError(friendlyError.title, friendlyError.message);
      // Signal failure to parent with an empty/error-like structure if needed
      onUploadComplete?.({ filenames: [], extracted_texts: [] }); // Or a structure indicating error
    } finally {
      setIsUploading(false);
      setSelectedFilesUI([]); // Clear UI list after attempt
      if (event.target) {
        event.target.value = '';
      }
      setTimeout(() => setOverallUploadStatus('idle'), 5000);
    }
  };

  // removeFileFromUI, getStatusIcon, getButtonColor, and JSX structure can remain largely the same
  // as they operate on selectedFilesUI and overallUploadStatus.
  // ... (rest of the FileUpload component as you provided, ensuring button styling reflects 'overallUploadStatus')
  const removeFileFromUI = (index: number) => {
    setSelectedFilesUI(prev => prev.filter((_, i) => i !== index));
    if (selectedFilesUI.length === 1 && overallUploadStatus !== 'idle' && !isUploading) { // Reset status if last file removed
        setOverallUploadStatus('idle');
    }
  };

  const getStatusIcon = () => {
    if (isUploading) return <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />;
    switch (overallUploadStatus) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      // Removed 'partial_success' as the current UploadResponse doesn't give per-file status
      default: return <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const acceptedFileExtensions = [
    // PDFs
    '.pdf',
    // Word Docs
    '.doc', '.docx',
    // Plain Text & Markdown
    '.txt', '.sent', '.md', '.rtf',
    // Images
    '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif',
    // Data Formats
    '.json', '.csv',
    // Excel
    '.xlsx'
    ].join(','); // Join with a comma

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileExtensions}
        onChange={handleFilesChange}
        className="hidden"
        disabled={isUploading || !currentSessionId}
      />
      
      <button
        onClick={handleFileSelectTrigger}
        disabled={isUploading || !currentSessionId}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200
                    ${!currentSessionId ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isUploading ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 cursor-wait' 
                                   : overallUploadStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                                   : overallUploadStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                                   : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                                  }`}
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">
          {isUploading ? "Uploading..." : overallUploadStatus === 'success' ? "Uploaded!" : overallUploadStatus === 'error' ? "Upload Error" : "Upload Files"}
        </span>
        <span className="sm:hidden">Upload</span>
      </button>

      {selectedFilesUI.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
          {selectedFilesUI.map((file, index) => (
            <div
              key={`${file.name}-${index}-${file.lastModified}`}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <FileIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-900 dark:text-gray-100 text-xs sm:text-sm">{file.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              {!isUploading && (
                <button
                  onClick={() => removeFileFromUI(index)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
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