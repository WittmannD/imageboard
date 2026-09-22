import { expect, test } from '@playwright/test';

import {
  signUpAndVerify,
  submitLoginForm,
} from '../../src/support/auth-flow.js';
import { allowAccess } from '../../src/support/consent.js';
import { waitForResetLink } from '../../src/support/mailpit.js';
import { waitForHydration } from '../../src/support/page.js';
import { createTestUser } from '../../src/support/user.js';

// Anonymous visitors throughout: each test drives the whole flow - login page,
// identity provider, mailbox, client - with a brand-new user.
test.describe('password reset', () => {
  test('a forgotten password is replaced through the emailed link', async ({
    page,
  }) => {
    const user = createTestUser();
    const newPassword = `${user.password}-new`;

    await signUpAndVerify(page, user);
    // Forget that session: this visitor is now someone who can't log in.
    await page.context().clearCookies();

    await page.goto('/auth/login');
    await waitForHydration(page);
    await page.getByTestId('login-forgot-password-link').click();
    await expect(page).toHaveURL(/\/auth\/forgot-password$/);
    await expect(page.getByTestId('forgot-password-submit')).toBeVisible();
    await page.getByTestId('forgot-password-email-input').fill(user.email);
    await page.getByTestId('forgot-password-submit').click();
    await expect(page.getByText('Check your email')).toBeVisible();

    await page.goto(await waitForResetLink(user.email));
    await waitForHydration(page);
    // The token lives in the fragment; the page drops it from the address bar.
    await expect(page).toHaveURL(/\/auth\/reset-password$/);

    await page.getByTestId('reset-password-new-input').fill(newPassword);
    await page.getByTestId('reset-password-confirm-input').fill(newPassword);
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByText('Password updated')).toBeVisible();

    await page.getByTestId('reset-password-login-link').click();

    // The old password is dead...
    await submitLoginForm(page, user);
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();

    // ...and the new one works.
    await submitLoginForm(page, { email: user.email, password: newPassword });
    await allowAccess(page);
    await expect(page).toHaveURL('/');
  });

  test('a reset link can only be used once', async ({ page }) => {
    const user = createTestUser();

    await signUpAndVerify(page, user);
    await page.context().clearCookies();

    await page.goto('/auth/forgot-password');
    await waitForHydration(page);
    await page.getByTestId('forgot-password-email-input').fill(user.email);
    await page.getByTestId('forgot-password-submit').click();
    await expect(page.getByText('Check your email')).toBeVisible();

    const link = await waitForResetLink(user.email);
    const choosePassword = async (password: string) => {
      // Opening the link again in a tab that's still on the reset page would
      // only change the fragment (no reload), unlike a real click from email.
      await page.goto('about:blank');
      await page.goto(link);
      await waitForHydration(page);
      await page.getByTestId('reset-password-new-input').fill(password);
      await page.getByTestId('reset-password-confirm-input').fill(password);
      await page.getByTestId('reset-password-submit').click();
    };

    await choosePassword(`${user.password}-first`);
    await expect(page.getByText('Password updated')).toBeVisible();

    await choosePassword(`${user.password}-second`);
    await expect(page.getByText('Reset link invalid')).toBeVisible();
  });

  test('a link without a valid token is rejected', async ({ page }) => {
    await page.goto('/auth/reset-password');
    await expect(page.getByText('Reset link invalid')).toBeVisible();

    // A fragment-only change wouldn't reload the page; start from a clean tab.
    await page.goto('about:blank');
    await page.goto('/auth/reset-password#token=not-a-real-token');
    await waitForHydration(page);
    await page.getByTestId('reset-password-new-input').fill('a-long-password');
    await page.getByTestId('reset-password-confirm-input').fill('a-long-password');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByText('Reset link invalid')).toBeVisible();
  });
});
