import { type Browser, expect, type Page } from '@playwright/test';

import { env } from '../env.js';
import { waitForOtp } from './mailpit.js';
import { waitForHydration } from './page.js';
import { createTestUser, type TestUser } from './user.js';

/**
 * Whatever page starts the identity flow, the visitor lands on the login form:
 * the provider's only interactive prompt is `login`, and the sign-up form is
 * reached from there through the "Sign up" link (which carries the pending
 * request's `uid` along). A fresh account is therefore always created by
 * signing up, then optionally returned to through the login form.
 * The steps are exported separately so specs can assert between them.
 */

export const LOGIN_HEADING = 'Login to your account';
export const SIGNUP_HEADING = 'Create an account';
export const VERIFICATION_PATH = '/users/email-verification';

/**
 * Both headings appear inside the form's description too ("...to login to your
 * account"), so match the whole text of the title, not a substring.
 */
export function loginHeading(page: Page) {
  return page.getByText(LOGIN_HEADING, { exact: true });
}

export function signupHeading(page: Page) {
  return page.getByText(SIGNUP_HEADING, { exact: true });
}

/** From the login form, follow "Sign up" to the registration form. */
export async function openSignupForm(page: Page) {
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(signupHeading(page)).toBeVisible();
}

/**
 * Get an anonymous visitor to the sign-up form. `entryPath` is any page that
 * starts the identity flow (the login page itself, or a private page that
 * bounces anonymous visitors to it).
 */
export async function startSignup(page: Page, entryPath = '/auth/login') {
  await page.goto(entryPath);
  await expect(loginHeading(page)).toBeVisible();
  await openSignupForm(page);
}

/** Fill and submit the sign-up form the identity flow lands on. */
export async function submitSignupForm(page: Page, user: TestUser) {
  // The form submits via fetch (react-hook-form), not a native POST - filling
  // and clicking before hydration finishes lands on a page with no submit
  // handler attached yet.
  await waitForHydration(page);
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
}

/** Fill and submit the login form the identity flow lands on. */
export async function submitLoginForm(
  page: Page,
  credentials: Pick<TestUser, 'email' | 'password'>,
) {
  // Same reason as the sign-up form: it submits via fetch, so it does
  // nothing until React has hydrated.
  await waitForHydration(page);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

/**
 * Sign in the way a returning user does: open the login form, submit it, and
 * land on the home page. Each call is a new login, so it gets its own
 * provider session and grant - unlike the shared, storage-state session
 * (see fixtures.ts).
 */
export async function signIn(
  page: Page,
  credentials: Pick<TestUser, 'email' | 'password'>,
) {
  await page.goto('/auth/login');
  await expect(loginHeading(page)).toBeVisible();
  await submitLoginForm(page, credentials);
  await expect(page).toHaveURL('/');
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
  entryPath = '/auth/login',
) {
  await startSignup(page, entryPath);

  await submitSignupForm(page, user);
  await expect(page).toHaveURL(new RegExp(VERIFICATION_PATH));

  await verifyEmail(page, user);
  await expect(page).not.toHaveURL(new RegExp(VERIFICATION_PATH));
}

/**
 * A second verified account, made in a browser context of its own so the
 * calling test's page keeps whatever session it has.
 */
export async function registerUser(
  browser: Browser,
  prefix = 'other',
): Promise<TestUser> {
  const user = createTestUser(prefix);
  const context = await browser.newContext({ baseURL: env.baseUrl });

  try {
    await signUpAndVerify(await context.newPage(), user);
  } finally {
    await context.close();
  }

  return user;
}
