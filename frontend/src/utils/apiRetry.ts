/**
 * Retry utility for API calls
 * Automatically retries failed requests with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, rate limit, server errors
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  const delay = initialDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryable(error: any, retryableStatuses: number[]): boolean {
  if (!error) return false;
  
  // Network errors (no response)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // HTTP status errors
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }
  
  // Response status errors
  if (error.response?.status && retryableStatuses.includes(error.response.status)) {
    return true;
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt >= opts.maxRetries || !isRetryable(error, opts.retryableStatuses)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay);
      opts.onRetry(attempt + 1, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrapper for fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(
    async () => {
      const response = await fetch(url, options);
      
      // Check if response status is retryable
      if (!response.ok) {
        const retryableStatuses = retryOptions.retryableStatuses || defaultOptions.retryableStatuses;
        if (retryableStatuses.includes(response.status)) {
          throw { status: response.status, response };
        }
      }
      
      return response;
    },
    retryOptions
  );
}

