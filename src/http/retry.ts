import { SearxngError } from "../errors/searxng-error.ts";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: SearxngError | undefined;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof SearxngError) || error.status !== 429) {
        throw error;
      }

      lastError = error;

      if (attempt === options.maxRetries) {
        break;
      }

      const backoff = options.baseDelayMs * Math.pow(2, attempt);
      const delay =
        error.retryAfter !== undefined
          ? Math.max(error.retryAfter * 1000, backoff)
          : backoff;

      await sleep(delay);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
