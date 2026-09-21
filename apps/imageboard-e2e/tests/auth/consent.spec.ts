import { expect, type Page, test } from '@playwright/test';

import { env } from '../../src/env.js';
import {
  loginHeading,
  signUpAndVerify,
  submitLoginForm,
} from '../../src/support/auth-flow.js';
import {
  allowAccess,
  allowButton,
  CLIENT_NAME,
  consentHeading,
  denyAccess,
  denyButton,
} from '../../src/support/consent.js';
import { headerLogIn, headerLogOut } from '../../src/support/logout.js';
import { requestVia } from '../../src/support/nginx.js';
import { createTestUser, type TestUser } from '../../src/support/user.js';

const CONSENT_URL = /\/auth\/consent\?.*\buid=/;

// Anonymous visitors: each test signs a brand-new user up, forgets the
// session, and logs in again, so the consent screen is reached the way a
// returning user reaches it.
test.describe('consent', () => {
  async function returningUser(page: Page): Promise<TestUser> {
    const user = createTestUser();

    await signUpAndVerify(page, user);
    await page.context().clearCookies();

    return user;
  }

  test('logging in asks what the app may do, and allowing signs the user in', async ({
    page,
  }) => {
    const user = await returningUser(page);

    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();
    await submitLoginForm(page, user);

    await expect(page).toHaveURL(CONSENT_URL);
    await expect(consentHeading(page)).toBeVisible();
    // Who is asking, on whose behalf, and for what.
    await expect(page.getByText(`You are signed in as ${user.email}.`)).toBeVisible();
    await expect(page.getByText(`${CLIENT_NAME} will be able to:`)).toBeVisible();
    for (const permission of [
      'Know who you are on this service',
      'See your username',
      'See your email address and whether it is verified',
      'Keep you signed in until you log out',
    ]) {
      await expect(page.getByText(permission)).toBeVisible();
    }

    await allowButton(page).click();

    await expect(page).toHaveURL('/');
    await expect(headerLogOut(page)).toBeVisible();
    await page.goto('/users/me');
    await expect(
      page.getByText(`@${user.username}`, { exact: true }),
    ).toBeVisible();
  });

  test('denying leaves the user signed out and explains why', async ({
    page,
  }) => {
    const user = await returningUser(page);

    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();
    await submitLoginForm(page, user);
    await denyAccess(page);

    await expect(page).toHaveURL(/\/auth\/error\?/);
    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByText('Access was not granted')).toBeVisible();

    await page.getByRole('link', { name: 'Return home' }).click();
    await expect(page).toHaveURL('/');
    await expect(headerLogIn(page)).toBeVisible();
    await expect(headerLogOut(page)).toBeHidden();
  });

  test('after denying, the next sign-in asks again', async ({ page }) => {
    const user = await returningUser(page);

    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();
    await submitLoginForm(page, user);
    await denyAccess(page);
    await expect(page).toHaveURL(/\/auth\/error\?/);

    // The login itself succeeded, so the provider goes straight to consent
    // without asking for the password again.
    await page.goto('/auth/login');
    await expect(consentHeading(page)).toBeVisible();
    await expect(denyButton(page)).toBeVisible();

    await allowAccess(page);
    await expect(page).toHaveURL('/');
    await expect(headerLogOut(page)).toBeVisible();
  });

  test('the consent endpoints refuse a caller with no pending authorization', async () => {
    // Node can't resolve the stack's hostnames, so go through nginx by hand.
    const calls = [
      ['GET', '/interactions/nope/consent'],
      ['POST', '/interactions/nope/consent'],
      ['POST', '/interactions/nope/consent/deny'],
    ] as const;

    for (const [method, path] of calls) {
      const response = await requestVia(env.authHost, path, {
        method,
        headers: { Origin: env.baseUrl },
      });

      expect(response.status, `${method} ${path}`).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        errorCode: 'invalid_interaction',
      });
    }
  });
});
