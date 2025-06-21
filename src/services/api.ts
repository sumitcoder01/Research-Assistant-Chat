// src/services/api.ts
import axios, { AxiosError } from 'axios';
import { QueryResponse, SessionHistoryResponse, UploadResponse, LLMProvider } from '../types';
import { handleApiError, handleFileUploadError } from '../utils/errorHandler';

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes default
});

export const apiService = {
  /**
   * Checks the health of the backend API.
   */
  async checkHealth(): Promise<{ status: string }> {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  /**
   * Creates a new research session on the backend.
   * @param sessionId Optional specific ID to suggest for the new session.
   */
  async createSession(sessionId?: string): Promise<{ session_id: string; message: string }> {
    try {
      const response = await api.post('/api/v1/sessions', sessionId ? { session_id: sessionId } : {});
      return response.data;
    } catch (error) {
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  /**
   * Submits a research query to the backend.
   * This can be a simple text query or include parameters for document processing.
   * It sends data as 'multipart/form-data' to align with the backend endpoint's signature.
   */
  async submitQuery(
    params: {
      query: string;
      sessionId: string;
      llmProvider: LLMProvider;
      llmModel: string;
    }
  ): Promise<QueryResponse> {
    try {

      const data = {
        query:params.query,
        session_id:params.sessionId,
        llm_provider:params.llmProvider,
        llm_model:params.llmModel,
      };

      const response = await api.post<QueryResponse>('/api/v1/query', data);
      return response.data;
    } catch (error) {
      console.error('Query submission error:', error);
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  },

  /**
   * Retrieves the message history for a given session.
   */
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

  /**
   * Uploads one or more documents for processing.
   */
  async uploadDocuments(
    sessionId: string,
    files: File[],
    embeddingProvider: string = 'google' // Default to 'google' if not specified
  ): Promise<UploadResponse> {
    try {
      // Client-side validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

      for (const file of files) {
        if (file.size > maxSize) {
          throw new Error(`File "${file.name}" is too large (max 10MB).`);
        }
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(extension)) {
          throw new Error(`File "${file.name}" format not supported. Allowed: ${allowedTypes.join(', ')}.`);
        }
      }

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('embedding_provider', embeddingProvider);

      files.forEach((file) => {
        formData.append('files', file, file.name);
      });

      const response = await api.post<UploadResponse>('/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes for potentially large file processing
      });
      return response.data;
    } catch (error) {
      console.error('File upload error in apiService:', error);
      if (!(error instanceof AxiosError)) {
        const friendlyError = handleFileUploadError(error);
        throw new Error(friendlyError.message);
      }
      const friendlyError = handleApiError(error);
      throw new Error(friendlyError.message);
    }
  }
};