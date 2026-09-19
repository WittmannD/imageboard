import type { Page } from '@playwright/test';

/**
 * Pages are server-rendered, so they are visible and clickable before React
 * has hydrated them. Interacting in that window is lost: a value typed into a
 * controlled input is wiped when hydration re-renders it, and events fired at
 * a React handler that isn't attached yet are dropped. The result is a test
 * that fails about one run in thirty, with an empty field in the screenshot.
 *
 * Call this after navigating and before touching such elements. Nothing on
 * these pages polls, so network idle is a dependable sign that the bundle has
 * loaded and React has taken over.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}
