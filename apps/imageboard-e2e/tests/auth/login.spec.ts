import { expect, test } from '@playwright/test';

import {
  loginHeading,
  signUpAndVerify,
  submitLoginForm,
} from '../../src/support/auth-flow.js';
import { createTestUser } from '../../src/support/user.js';

const LOGIN_URL = /\/auth\/login\?.*\buid=/;

// Anonymous visitors: an account is created through the real sign-up flow,
// then the browser forgets its session so the visitor is "returning".
test.describe('login', () => {
  test('a returning user signs in with their password', async ({ page }) => {
    const user = createTestUser();

    await signUpAndVerify(page, user);
    await page.context().clearCookies();

    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();
    await submitLoginForm(page, user);
    await expect(page).toHaveURL('/');

    await page.goto('/users/me');
    await expect(
      page.getByText(`@${user.username}`, { exact: true }),
    ).toBeVisible();
  });

  test('a wrong password shows an error on the same form and can be retried', async ({
    page,
  }) => {
    const user = createTestUser();

    await signUpAndVerify(page, user);
    await page.context().clearCookies();

    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();
    await submitLoginForm(page, { email: user.email, password: 'not-the-one' });

    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    await expect(page).toHaveURL(LOGIN_URL);

    // The pending authorization request survived the failed attempt, so the
    // same form can simply be resubmitted.
    await submitLoginForm(page, user);
    await expect(page).toHaveURL('/');
  });

  test('a malformed email is caught before anything is sent', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await expect(loginHeading(page)).toBeVisible();

    await submitLoginForm(page, { email: 'not-an-email', password: 'whatever' });

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL(LOGIN_URL);
  });
});
