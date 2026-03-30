/** Delay between API requests to reduce rate-limit (429) hits. */
export const DELAY_BETWEEN_REQUESTS_MS = 1000;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
