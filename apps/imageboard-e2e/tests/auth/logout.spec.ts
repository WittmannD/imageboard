import { env } from '../../src/env.js';
import { expect, test } from '../../src/fixtures.js';
import {
  loginHeading,
  registerUser,
  signIn,
} from '../../src/support/auth-flow.js';
import { allowAccess } from '../../src/support/consent.js';
import {
  confirmSignOut,
  declineSignOut,
  headerLogOut,
  type LogOutEntry,
  sessionCookies,
  signOutPrompt,
  startLogOut,
} from '../../src/support/logout.js';
import { requestVia } from '../../src/support/nginx.js';
import { readRefreshToken, refreshGrant } from '../../src/support/session.js';

const LOGIN_URL = /\/auth\/login\?.*\buid=/;

test.describe('log out', () => {
  // Logging out revokes the session's tokens at the provider, and the
  // fixture's storage-state session is shared by every test in the worker
  // (see fixtures.ts). Start from an empty browser and sign in again instead:
  // each test then owns a session, and the provider only ends the one the
  // prompt was answered in.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('signed in', () => {
    test.beforeEach(async ({ page, user }) => {
      await signIn(page, user);

      // Both login sessions exist now - so their absence later means something.
      expect(await sessionCookies(page)).toEqual({ app: true, provider: true });
    });

    for (const entry of ['header', 'profile'] as const satisfies LogOutEntry[]) {
      test(`the ${entry} button asks the provider, then ends the session`, async ({
        page,
      }) => {
        await startLogOut(page, entry);

        const prompt = signOutPrompt(page);
        await expect(prompt.confirm).toBeVisible();
        await expect(prompt.decline).toBeVisible();

        await confirmSignOut(page);
        expect(await sessionCookies(page)).toEqual({
          app: false,
          provider: false,
        });

        // Nothing is remembered: a private page now sends the visitor to a real
        // login prompt instead of silently signing them back in.
        await page.goto('/users/me');
        await expect(page).toHaveURL(LOGIN_URL);
        await expect(loginHeading(page)).toBeVisible();
      });
    }

    test('a different account can sign in afterwards', async ({
      page,
      browser,
      user,
    }) => {
      // Registering and verifying the second account is a full round trip.
      test.setTimeout(120_000);

      const other = await registerUser(browser);

      await startLogOut(page);
      await confirmSignOut(page);
      await signIn(page, other);

      await page.goto('/users/me');
      await expect(
        page.getByText(`@${other.username}`, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(`@${user.username}`, { exact: true }),
      ).toBeHidden();
    });

    test('ends only that session, and revokes its tokens', async ({
      page,
      account,
    }) => {
      // This test's own login, and the worker's shared session: two sessions
      // of the same account.
      const mine = readRefreshToken(await page.context().cookies());
      const shared = readRefreshToken(account.storageState.cookies);
      expect(mine).not.toBe(shared);

      await startLogOut(page);
      await confirmSignOut(page);

      expect(await refreshGrant(mine)).toMatchObject({
        status: 400,
        error: 'invalid_grant',
      });
      // The other session is untouched. This also shows the request itself is
      // well-formed, so the rejection above is the revocation and not a typo.
      expect(await refreshGrant(shared)).toMatchObject({
        status: 200,
        hasAccessToken: true,
      });
    });

    test('opening /auth/logout does not sign out', async ({ page }) => {
      // Ending a session must take a POST, or any link or image could do it.
      await page.goto('/auth/logout');

      await expect(page).toHaveURL('/');
      await expect(headerLogOut(page)).toBeVisible();
      expect(await sessionCookies(page)).toEqual({ app: true, provider: true });
    });

    test.describe('when the provider prompt is declined', () => {
      test('the app is signed out anyway, and the provider keeps its session', async ({
        page,
      }) => {
        const token = readRefreshToken(await page.context().cookies());

        await startLogOut(page);
        await declineSignOut(page);

        // The app ends its own session, and revokes its tokens, before the
        // provider is even asked - so "No" only spares the provider's session.
        expect(await sessionCookies(page)).toEqual({
          app: false,
          provider: true,
        });
        expect(await refreshGrant(token)).toMatchObject({
          status: 400,
          error: 'invalid_grant',
        });
      });

      test('the visitor can sign in again', async ({ page }) => {
        await startLogOut(page);
        await declineSignOut(page);

        // The provider still knows who this is, but the client's grant went
        // with the logout: no login form, just a fresh request for consent.
        await page.goto('/auth/login');
        await allowAccess(page);

        await expect(page).toHaveURL('/');
        await expect(headerLogOut(page)).toBeVisible();
      });
    });
  });

  test.describe('without a session', () => {
    test('logging out just goes home, without visiting the provider', async () => {
      // Node can't resolve the stack's hostnames, so go through nginx by hand.
      const response = await requestVia(env.domain, '/auth/logout', {
        method: 'POST',
      });

      expect([302, 303]).toContain(response.status);

      const location = new URL(response.headers.location ?? '', env.baseUrl);
      expect(location.origin).toBe(env.baseUrl);
      expect(location.pathname).toBe('/');
    });
  });
});
