/**
 * Centralized Error Handling & Logging Utility
 * Provides consistent error handling, structured logging, and production observability
 */

import { APIError, NetworkError, DatabaseError } from '../api/errors';

// ============================================================================
// ERROR SEVERITY & FORMATTING
// ============================================================================

/**
 * Error severity levels
 */
enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Formatted error for display
 */
interface FormattedError {
  title: string;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
}

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: ErrorSeverity;
  context?: string;
  message: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

// ============================================================================
// ERROR TRACKING INITIALIZATION
// ============================================================================

/**
 * Error tracking service interface (Sentry-compatible)
 */
interface ErrorTracker {
  captureException: (error: unknown, extra?: Record<string, unknown>) => void;
  captureMessage: (message: string, level: ErrorSeverity, extra?: Record<string, unknown>) => void;
  setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
  addBreadcrumb: (breadcrumb: { category: string; message: string; level?: string }) => void;
}

let errorTracker: ErrorTracker | null = null;

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: ErrorSeverity,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data,
    error,
  };
}

/**
 * Output log entry to console (development) and error tracking (production)
 */
function outputLog(entry: LogEntry): void {
  // Development: Console logging
  if (__DEV__) {
    const prefix = `[${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`;
    const logFn = entry.level === ErrorSeverity.ERROR || entry.level === ErrorSeverity.CRITICAL
      ? console.error
      : entry.level === ErrorSeverity.WARNING
        ? console.warn
        : entry.level === ErrorSeverity.DEBUG
          ? console.debug
          : console.log;

    logFn(prefix, entry.message, entry.data ?? '', entry.error ?? '');
  }

  // Production: Send to error tracking service
  if (!__DEV__ && errorTracker) {
    if (entry.error) {
      errorTracker.captureException(entry.error, {
        context: entry.context,
        message: entry.message,
        ...entry.data,
      });
    } else if (entry.level === ErrorSeverity.ERROR || entry.level === ErrorSeverity.CRITICAL) {
      errorTracker.captureMessage(entry.message, entry.level, {
        context: entry.context,
        ...entry.data,
      });
    } else {
      // Add breadcrumb for non-error logs
      errorTracker.addBreadcrumb({
        category: entry.context ?? 'app',
        message: entry.message,
        level: entry.level,
      });
    }
  }
}

/**
 * Log informational message
 */
export function logInfo(message: string, context?: string, data?: Record<string, unknown>): void {
  const entry = createLogEntry(ErrorSeverity.INFO, message, context, data);
  outputLog(entry);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: string, data?: Record<string, unknown>): void {
  const entry = createLogEntry(ErrorSeverity.WARNING, message, context, data);
  outputLog(entry);
}

/**
 * Log error with optional context
 * In production, sends to error tracking service
 *
 * @param error - Error to log
 * @param context - Additional context about where error occurred
 */
export function logError(error: unknown, context?: string): void {
  const formatted = formatError(error);
  const entry = createLogEntry(
    formatted.severity,
    formatted.message,
    context,
    { title: formatted.title, retryable: formatted.retryable },
    error
  );
  outputLog(entry);
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

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

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Check if error is a cancellation (AbortError)
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('aborted');
  }
  return false;
}
