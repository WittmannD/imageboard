import { expect, type Page } from '@playwright/test';

import { waitForOtp } from './mailpit.js';
import { waitForHydration } from './page.js';
import type { TestUser } from './user.js';

/**
 * Registration is the only way to obtain a session today: the login page
 * renders the sign-up form, so there is no sign-in for returning users yet.
 * The steps are exported separately so specs can assert between them.
 */

export const SIGNUP_HEADING = 'Create an account';
export const VERIFICATION_PATH = '/users/email-verification';

/** Fill and submit the sign-up form the identity flow lands on. */
export async function submitSignupForm(page: Page, user: TestUser) {
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
}

/** Submit a one-time code on the email verification page. */
export async function submitOtp(page: Page, otp: string) {
  // The code input is a controlled component: filling it before hydration
  // finishes gets wiped, and the native `required` check then blocks submit.
  await waitForHydration(page);
  await page.locator('input[name="otp"]').fill(otp);
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
}

/** Read the code from the mailbox and submit it. */
export async function verifyEmail(page: Page, user: TestUser) {
  await submitOtp(page, await waitForOtp(user.email));
}

/**
 * Sign up through the real UI and verify the email address, ending on
 * `returnTo` (the app's default is the feed).
 */
export async function signUpAndVerify(
  page: Page,
  user: TestUser,
  entryPath = '/auth/registration',
) {
  await page.goto(entryPath);
  await expect(page.getByText(SIGNUP_HEADING)).toBeVisible();

  await submitSignupForm(page, user);
  await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));

  await verifyEmail(page, user);
  await expect(page).not.toHaveURL(new RegExp(VERIFICATION_PATH));
}
