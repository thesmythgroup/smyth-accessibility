import { delay } from "./delay";

const RETRYABLE_STATUSES = [429, 503];
const MAX_ATTEMPTS = 3;
const INITIAL_DELAY_MS = 2000;

function isRetryable(error: unknown): boolean {
  const status =
    (error as { status?: number }).status ??
    (error as { response?: { status?: number } }).response?.status;
  return typeof status === "number" && RETRYABLE_STATUSES.includes(status);
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  let delayMs = INITIAL_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry = attempt < MAX_ATTEMPTS && isRetryable(error);
      if (!canRetry) {
        throw error;
      }
      await delay(delayMs);
      delayMs *= 2;
    }
  }

  throw lastError;
}
