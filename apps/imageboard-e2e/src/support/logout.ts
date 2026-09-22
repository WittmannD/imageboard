import { expect, type Page } from '@playwright/test';

import { waitForHydration } from './page.js';
import { appSessionCookie, providerSessionCookies } from './session.js';

/**
 * The header's account menu trigger (avatar + "@username") - present on
 * every page while signed in. Its "Log Out" entry is a menu item, not a
 * plain button, and opens in a portal (see `headerMenuLogOut`).
 */
export const headerUserMenuTrigger = (page: Page) =>
  page.getByTestId('header-user-menu-trigger');

/**
 * The dropdown's "Log Out" entry. The menu popup renders in a portal, so
 * it's not a descendant of `<header>` once open - this looks page-wide.
 */
export const headerMenuLogOut = (page: Page) =>
  page.getByTestId('header-menu-logout');

export const headerLogIn = (page: Page) => page.getByTestId('header-login-link');

/** The profile section's own button (on `/users/me`). */
export const profileLogOut = (page: Page) => page.getByTestId('profile-logout');

/**
 * The provider's confirmation page (the auth-pages package). The host in the
 * heading isn't asserted: it's whatever the provider thinks it is behind nginx.
 */
export function signOutPrompt(page: Page) {
  return {
    heading: page.getByTestId('sign-out-heading'),
    confirm: page.getByTestId('sign-out-confirm'),
    decline: page.getByTestId('sign-out-decline'),
  };
}

/** Which of the two places offering "Log Out" to click. */
export type LogOutEntry = 'header' | 'profile';

/** Click "Log Out", leaving the browser on the provider's confirmation page. */
export async function startLogOut(page: Page, entry: LogOutEntry = 'header') {
  await page.goto(entry === 'profile' ? '/users/me' : '/');
  await waitForHydration(page);

  if (entry === 'profile') {
    await profileLogOut(page).click();
  } else {
    await headerUserMenuTrigger(page).click();
    await headerMenuLogOut(page).click();
  }

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
  await expect(headerUserMenuTrigger(page)).toBeHidden();
}

/** Which of the two login sessions the browser currently holds a cookie for. */
export async function sessionCookies(page: Page) {
  const cookies = await page.context().cookies();

  return {
    app: appSessionCookie(cookies) !== undefined,
    provider: providerSessionCookies(cookies).length > 0,
  };
}
