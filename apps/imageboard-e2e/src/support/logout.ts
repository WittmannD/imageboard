import { expect, type Page } from '@playwright/test';

import { waitForHydration } from './page.js';
import { appSessionCookie, providerSessionCookies } from './session.js';

/** The header's button - present on every page while signed in. */
export const headerLogOut = (page: Page) =>
  page.locator('header').getByRole('button', { name: 'Log Out' });

export const headerLogIn = (page: Page) =>
  page.locator('header').getByRole('link', { name: 'Log In' });

/** The profile section's own button (on `/users/me`), inside `<main>`. */
export const profileLogOut = (page: Page) =>
  page.locator('main').getByRole('button', { name: 'Log Out' });

/**
 * The provider's confirmation page (the auth-pages package). The host in the
 * heading isn't asserted: it's whatever the provider thinks it is behind nginx.
 */
export function signOutPrompt(page: Page) {
  return {
    heading: page.getByRole('heading', { name: /^Sign out of .+\?$/ }),
    confirm: page.getByRole('button', { name: 'Yes, sign me out' }),
    decline: page.getByRole('button', { name: 'No, stay signed in' }),
  };
}

/** Which of the two places offering "Log Out" to click. */
export type LogOutEntry = 'header' | 'profile';

/** Click "Log Out", leaving the browser on the provider's confirmation page. */
export async function startLogOut(page: Page, entry: LogOutEntry = 'header') {
  await page.goto(entry === 'profile' ? '/users/me' : '/');
  await waitForHydration(page);
  await (entry === 'profile' ? profileLogOut(page) : headerLogOut(page)).click();
  await expect(signOutPrompt(page).heading).toBeVisible();
}

/** Answer "Yes, sign me out" and wait to be sent back to the app. */
export async function confirmSignOut(page: Page) {
  await signOutPrompt(page).confirm.click();
  await expectSignedOut(page);
}

/** Answer "No, stay signed in" and wait to be sent back to the app. */
export async function declineSignOut(page: Page) {
  await signOutPrompt(page).decline.click();
  await expectSignedOut(page);
}

/** Back on the home page, and the app no longer treats the visitor as signed in. */
export async function expectSignedOut(page: Page) {
  await expect(page).toHaveURL('/');
  await expect(headerLogIn(page)).toBeVisible();
  await expect(headerLogOut(page)).toBeHidden();
}

/** Which of the two login sessions the browser currently holds a cookie for. */
export async function sessionCookies(page: Page) {
  const cookies = await page.context().cookies();

  return {
    app: appSessionCookie(cookies) !== undefined,
    provider: providerSessionCookies(cookies).length > 0,
  };
}
