const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface PollOptions {
  timeout?: number;
  interval?: number;
}

/**
 * Re-runs `probe` until it returns something other than `null`/`undefined`.
 * For waiting on things outside the browser (mailbox, HTTP readiness); use
 * Playwright's web-first assertions for anything on the page.
 */
export async function pollUntil<T>(
  description: string,
  probe: () => Promise<T | null | undefined>,
  { timeout = 30_000, interval = 500 }: PollOptions = {},
): Promise<T> {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  for (;;) {
    try {
      const value = await probe();
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }

    if (Date.now() >= deadline) {
      const reason =
        lastError instanceof Error ? ` (last error: ${lastError.message})` : '';
      throw new Error(
        `Timed out after ${timeout}ms waiting for ${description}${reason}`,
      );
    }

    await sleep(interval);
  }
}
