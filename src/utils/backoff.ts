/**
 * Simple exponential backoff utility for retrying failed operations
 */

export interface BackoffOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Executes an async operation with exponential backoff retry logic
 * @param operation - The async operation to retry
 * @param options - Backoff configuration options
 * @returns Promise resolving to the operation result
 */
export async function withBackoff<T>(
  operation: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 100, maxDelayMs = 2000 } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't wait after the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Creates a backoff function with pre-configured options
 * @param options - Default backoff configuration
 * @returns A function that applies backoff to any operation
 */
export function createBackoff(options: BackoffOptions = {}) {
  return <T>(operation: () => Promise<T>) => withBackoff(operation, options);
}
