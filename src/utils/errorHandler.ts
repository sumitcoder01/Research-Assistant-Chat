import { AxiosError } from 'axios';

export interface UserFriendlyError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export const handleApiError = (error: unknown): UserFriendlyError => {
  // Always log the full error for developers
  console.error('🔴 API Error Details:', error);

  // Handle AxiosErrors (network requests to backend)
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the research assistant. Please check your internet connection and try again.',
        type: 'error',
      };
    }

    const status = error.response.status;
    const data = error.response.data;

    // Extract specific message from backend response
    let specificMessage: string | null = null;
    if (data && typeof data.detail === 'string') {
      specificMessage = data.detail;
    } else if (data && typeof data.message === 'string') {
      specificMessage = data.message;
    } else if (typeof data === 'string') {
      specificMessage = data;
    }

    // Filter out technical messages that users shouldn't see
    if (specificMessage && (
      specificMessage.length > 300 ||
      specificMessage.toLowerCase().includes("traceback") ||
      specificMessage.toLowerCase().includes("exception") ||
      specificMessage.toLowerCase().includes("chatprompttemplate") ||
      specificMessage.toLowerCase().includes("langchain") ||
      specificMessage.toLowerCase().includes("variables") ||
      specificMessage.toLowerCase().includes("expected:") ||
      specificMessage.toLowerCase().includes("received:") ||
      specificMessage.toLowerCase().includes("troubleshooting")
    )) {
      specificMessage = null; // Use generic message instead
    }

    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: 'The request format was incorrect. Please try rephrasing your query or check your inputs.',
          type: 'error',
        };
      case 401:
        return {
          title: 'Authentication Error',
          message: 'Authentication failed. The API key might be invalid or expired.',
          type: 'error',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: "You don't have permission to perform this action.",
          type: 'warning',
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource could not be found.',
          type: 'error',
        };
      case 422:
        return {
          title: 'Processing Error',
          message: 'There was an issue processing your request. Please try simplifying your query or try again.',
          type: 'error',
        };
      case 429:
        return {
          title: 'Rate Limited',
          message: 'Too many requests. Please wait a moment before trying again.',
          type: 'warning',
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'The research assistant is experiencing technical difficulties. Please try again in a few minutes.',
          type: 'error',
        };
      case 502:
      case 503:
      case 504:
        return {
          title: 'Service Unavailable',
          message: 'The research assistant is temporarily unavailable. Please try again later.',
          type: 'error',
        };
      default:
        return {
          title: `Server Error`,
          message: 'An unexpected server error occurred. Please try again.',
          type: 'error',
        };
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    const errorMessage = error.message;

    // Log the original error message for debugging
    console.error('🔴 Original Error Message:', errorMessage);

    // Check for specific error patterns and provide user-friendly messages
    if (errorMessage.toLowerCase().includes('chatprompttemplate') || 
        errorMessage.toLowerCase().includes('langchain') ||
        errorMessage.toLowerCase().includes('variables') ||
        errorMessage.toLowerCase().includes('expected:') ||
        errorMessage.toLowerCase().includes('received:')) {
      return {
        title: 'AI Processing Error',
        message: 'The AI assistant encountered an issue while processing your request. Please try rephrasing your query or try again.',
        type: 'error',
      };
    }

    if (errorMessage.toLowerCase().includes('api key') || 
        errorMessage.toLowerCase().includes('authentication failed')) {
      return {
        title: 'API Key Error',
        message: 'There seems to be an authentication issue. Please check the API configuration.',
        type: 'error',
      };
    }

    if (errorMessage.toLowerCase().includes('timeout') || 
        errorMessage.toLowerCase().includes('exceeded deadline')) {
      return {
        title: 'Request Timeout',
        message: 'Your request took too long to process. Please try again with a simpler query.',
        type: 'warning',
      };
    }

    if (errorMessage.toLowerCase().includes('file') && 
        (errorMessage.toLowerCase().includes('upload') || 
         errorMessage.toLowerCase().includes('process'))) {
      return handleFileUploadError(error);
    }

    if (errorMessage.toLowerCase().includes('session')) {
      return {
        title: 'Session Error',
        message: 'There was an issue with your chat session. Please try creating a new chat.',
        type: 'warning',
      };
    }

    // For other errors, check if the message is user-friendly
    if (errorMessage.length > 0 && errorMessage.length < 150 &&
        !errorMessage.toLowerCase().includes('traceback') &&
        !errorMessage.toLowerCase().includes('exception:') &&
        !errorMessage.toLowerCase().includes('error:') &&
        !errorMessage.toLowerCase().includes('failed to synthesize')) {
      return {
        title: 'Request Failed',
        message: errorMessage,
        type: 'error',
      };
    }

    // Generic fallback for Error objects
    return {
      title: 'Processing Error',
      message: 'An unexpected error occurred while processing your request. Please try again.',
      type: 'error'
    };
  }

  // Handle plain string errors
  if (typeof error === 'string') {
    console.error('🔴 String Error:', error);
    
    // Check for technical error patterns in string errors
    if (error.toLowerCase().includes('chatprompttemplate') ||
        error.toLowerCase().includes('langchain') ||
        error.toLowerCase().includes('variables') ||
        error.toLowerCase().includes('failed to synthesize')) {
      return {
        title: 'AI Processing Error',
        message: 'The AI assistant encountered a processing error. Please try rephrasing your query.',
        type: 'error'
      };
    }

    if (error.length > 0 && error.length < 150) {
      return { title: 'Error', message: error, type: 'error' };
    }
    return { title: 'Unknown Error', message: 'An unknown error occurred.', type: 'error' };
  }

  // Generic fallback for any unhandled error types
  console.error('🔴 Unhandled Error Type:', typeof error, error);
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again, and if the problem persists, please refresh the page.',
    type: 'error',
  };
};

export const handleFileUploadError = (error: unknown): UserFriendlyError => {
  console.error('🔴 File Upload Error Details:', error);

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('size') || errorMessage.includes('large')) {
      return {
        title: 'File Too Large',
        message: 'One or more files are too large. Please select files smaller than 10MB.',
        type: 'warning',
      };
    }
    if (errorMessage.includes('format') || errorMessage.includes('type') || errorMessage.includes('unsupported')) {
      return {
        title: 'Unsupported File Type',
        message: 'Please upload only supported file types (PDF, DOCX, TXT).',
        type: 'warning',
      };
    }
    
    // If the error message is user-friendly, use it
    if (errorMessage.length < 200 && 
        !errorMessage.includes('traceback') && 
        !errorMessage.includes('exception:')) {
      return {
        title: 'Upload Failed',
        message: error.message,
        type: 'error'
      };
    }
  }

  // Fallback to general API error handler for AxiosErrors
  if (error instanceof AxiosError) {
    return handleApiError(error);
  }

  // Generic fallback for file uploads
  return {
    title: 'Upload Failed',
    message: 'Unable to upload your file(s) at this time. Please check the file(s) and try again.',
    type: 'error',
  };
};