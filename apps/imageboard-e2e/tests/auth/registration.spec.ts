import { expect, test } from '@playwright/test';

import {
  startSignup,
  submitOtp,
  submitSignupForm,
  VERIFICATION_PATH,
  verifyEmail,
} from '../../src/support/auth-flow.js';
import { waitForOtp } from '../../src/support/mailpit.js';
import { createTestUser } from '../../src/support/user.js';

const UNVERIFIED_NOTICE =
  'To start posting, you need to verify your email address.';

// Anonymous visitors: these tests drive the whole OIDC round trip
// (client -> identity provider -> client) with a brand-new user each time.
test.describe('registration', () => {
  test('sign up and verify the email with the emailed code', async ({
    page,
  }) => {
    const user = createTestUser();

    // The identity flow opens on the login form; sign-up is one click away.
    await startSignup(page);
    await submitSignupForm(page, user);

    // New accounts are unverified, so the callback diverts to verification.
    await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));
    await expect(
      page.getByText(`We sent a verification code to ${user.email}.`),
    ).toBeVisible();

    await verifyEmail(page, user);
    await expect(page).toHaveURL('/');

    // The session now carries a verified account: the profile shows the user
    // without the "verify your email" prompt.
    await page.goto('/users/me');
    await expect(
      page.getByText(`@${user.username}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(UNVERIFIED_NOTICE)).toBeHidden();
  });

  test('a wrong verification code is rejected and keeps the visitor on the page', async ({
    page,
  }) => {
    const user = createTestUser();

    await startSignup(page);
    await submitSignupForm(page, user);
    await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));

    // Wait for the real code so the wrong one is guaranteed to differ from it.
    const otp = await waitForOtp(user.email);
    await submitOtp(page, otp === '000000' ? '111111' : '000000');

    await expect(
      page.getByText('Invalid or expired code. Please try again.'),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));
  });

  test('after signing up the visitor lands back on the page they asked for', async ({
    page,
  }) => {
    const user = createTestUser();

    // An anonymous visitor asking for a private page is bounced through the
    // identity provider to the login form, and signs up from there...
    await startSignup(page, '/users/me');
    await submitSignupForm(page, user);
    await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));
    await verifyEmail(page, user);

    // ...and once verified, resumes where they were going.
    await expect(page).toHaveURL('/users/me');
    await expect(
      page.getByText(`@${user.username}`, { exact: true }),
    ).toBeVisible();
  });
});
