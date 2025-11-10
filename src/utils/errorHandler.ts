/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import { APIError, NetworkError, DatabaseError } from '../api/errors';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Formatted error for display
 */
export interface FormattedError {
  title: string;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
}

/**
 * Format error for user-friendly display
 *
 * @param error - Error to format
 * @returns Formatted error with title and message
 */
export function formatError(error: unknown): FormattedError {
  // API Errors
  if (error instanceof APIError) {
    return {
      title: 'API Error',
      message: getAPIErrorMessage(error),
      severity: error.statusCode && error.statusCode >= 500
        ? ErrorSeverity.ERROR
        : ErrorSeverity.WARNING,
      retryable: error.statusCode !== 404,
    };
  }

  // Network Errors
  if (error instanceof NetworkError) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: ErrorSeverity.ERROR,
      retryable: true,
    };
  }

  // Database Errors
  if (error instanceof DatabaseError) {
    return {
      title: 'Database Error',
      message: 'Failed to access local data. Please try restarting the app.',
      severity: ErrorSeverity.CRITICAL,
      retryable: true,
    };
  }

  // Standard Error objects
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message,
      severity: ErrorSeverity.ERROR,
      retryable: true,
    };
  }

  // Unknown errors
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    severity: ErrorSeverity.ERROR,
    retryable: true,
  };
}

/**
 * Get user-friendly message for API errors based on status code
 */
function getAPIErrorMessage(error: APIError): string {
  if (!error.statusCode) {
    return error.message;
  }

  switch (error.statusCode) {
    case 400:
      return 'Invalid request. Please try again.';
    case 401:
      return 'Authentication required. Please check your API key.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 404:
      return 'The requested content was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An error occurred while fetching data.';
  }
}

/**
 * Log error for debugging
 * In production, this could send to error tracking service (e.g., Sentry)
 *
 * @param error - Error to log
 * @param context - Additional context about where error occurred
 */
export function logError(error: unknown, context?: string): void {
  const formatted = formatError(error);

  // Console logging for development
  if (__DEV__) {
    console.error('[ErrorHandler]', {
      context,
      severity: formatted.severity,
      title: formatted.title,
      message: formatted.message,
      originalError: error,
    });
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { extra: { context, formatted } });
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const formatted = formatError(error);
  return formatted.retryable;
}

/**
 * Check if error is due to network/connectivity issues
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('fetch failed')
    );
  }

  return false;
}
