/**
 * Retry Utility with Exponential Backoff
 * Provides resilient network request handling
 */

import { RETRY } from '../constants';
import { APIError, NetworkError } from '../api/errors';

/**
 * Retry configuration options
 */
interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Custom function to determine if error is retryable */
  retryOn?: (error: unknown) => boolean;
  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
}

/**
 * Default retry predicate - determines if an error should trigger a retry
 */
function defaultRetryOn(error: unknown): boolean {
  // Network errors are always retryable
  if (error instanceof NetworkError) {
    return true;
  }

  // API errors - check status code
  if (error instanceof APIError && error.statusCode) {
    return (RETRY.RETRYABLE_STATUS_CODES as readonly number[]).includes(error.statusCode);
  }

  // Standard errors - check for network-related messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('fetch failed') ||
      message.includes('econnreset') ||
      message.includes('socket hang up')
    );
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Delay in milliseconds with jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * (0.75 + Math.random() * 0.5);

  return Math.round(jitter);
}

/**
 * Sleep for a specified duration with abort support
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = RETRY.MAX_ATTEMPTS,
    baseDelay = RETRY.BASE_DELAY_MS,
    maxDelay = RETRY.MAX_DELAY_MS,
    retryOn = defaultRetryOn,
    onRetry,
    signal,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check if aborted before each attempt
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt
      const isLastAttempt = attempt === maxAttempts - 1;

      // Check if error is retryable
      const shouldRetry = !isLastAttempt && retryOn(error);

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, baseDelay, maxDelay);

      // Invoke retry callback if provided
      onRetry?.(attempt + 1, error, delay);

      // Wait before retrying
      await sleep(delay, signal);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

