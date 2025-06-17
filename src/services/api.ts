import axios from 'axios';
import { ApiResponse, SessionHistoryResponse, UploadResponse, LLMProvider } from '../types';
import { handleApiError, handleFileUploadError } from '../utils/errorHandler';

const BASE_URL = import.meta.env.BACKEND_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
});

export const apiService = {
  // Health check
  async checkHealth(): Promise<{ status: string }> {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  // Create new research session
  async createSession(sessionId?: string): Promise<{ session_id: string; message: string }> {
    try {
      const response = await api.post('/api/v1/sessions', sessionId ? { session_id: sessionId } : {});
      return response.data;
    } catch (error) {
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  // Submit research query
  async submitQuery(
    query: string,
    sessionId: string,
    llmProvider: LLMProvider
  ): Promise<ApiResponse> {
    try {
      const response = await api.post('/api/v1/query', {
        query,
        session_id: sessionId,
        llm_provider: llmProvider
      });
      return response.data;
    } catch (error) {
      console.error('Query submission error:', error);
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  // Get session history
  async getSessionHistory(sessionId: string, limit?: number): Promise<SessionHistoryResponse> {
    try {
      const url = `/api/v1/sessions/${sessionId}/history${limit ? `?limit=${limit}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  // Upload documents
  async uploadDocuments(
    sessionId: string,
    embeddingProvider: LLMProvider,
    files: File[]
  ): Promise<UploadResponse> {
    try {
      // Validate files before upload
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      
      for (const file of files) {
        if (file.size > maxSize) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }
        
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(extension)) {
          throw new Error(`File "${file.name}" has an unsupported format. Please use PDF, DOC, DOCX, or TXT files.`);
        }
      }

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('embedding_provider', embeddingProvider);
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post('/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 60 seconds for file uploads
      });
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      const friendlyError = handleFileUploadError(error);
      throw new Error(friendlyError.message);
    }
  }
};