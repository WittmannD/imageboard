import { type BrowserContext, test as base } from '@playwright/test';

import { env } from './env.js';
import { signUpAndVerify } from './support/auth-flow.js';
import { createTestUser, type TestUser } from './support/user.js';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

interface Account {
  user: TestUser;
  storageState: StorageState;
}

/**
 * `test` from this module is signed in: every test gets a browser context that
 * already holds a session for a verified user.
 *
 * - The account is created once per worker, through the real sign-up and email
 *   verification flow, then reused. One user per worker (not one shared user)
 *   because the identity provider rotates refresh tokens, and parallel
 *   workers refreshing the same session would invalidate each other.
 * - Tests that need an anonymous visitor import `test` from
 *   '@playwright/test' instead.
 */
export const test = base.extend<{ user: TestUser }, { account: Account }>({
  account: [
    async ({ browser }, use) => {
      const user = createTestUser('worker');
      const context = await browser.newContext({ baseURL: env.baseUrl });
      let storageState: StorageState;

      try {
        await signUpAndVerify(await context.newPage(), user);
        storageState = await context.storageState();
      } finally {
        await context.close();
      }

      await use({ user, storageState });
    },
    { scope: 'worker', timeout: 120_000 },
  ],

  // Overrides the built-in option, so the default `context`/`page` fixtures
  // (and therefore traces and screenshots) are the signed-in ones.
  storageState: async ({ account }, use) => {
    await use(account.storageState);
  },

  user: async ({ account }, use) => {
    await use(account.user);
  },
});

export { expect } from '@playwright/test';
