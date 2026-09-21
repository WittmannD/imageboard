import { expect, type Page } from '@playwright/test';

/**
 * The client's name on the consent screen, from the provider's `client_name`
 * (it falls back to `OIDC_CLIENT_NAME`, then "Imageboard").
 */
export const CLIENT_NAME = 'Imageboard';

/** The consent screen's title: it names the client asking for access. */
export function consentHeading(page: Page) {
  return page.getByText(`Allow ${CLIENT_NAME} to access your account?`, {
    exact: true,
  });
}

/**
 * The screen is drawn from a fetch to the provider, so its buttons only exist
 * once React has hydrated and the request came back - no separate wait for
 * hydration is needed before clicking them.
 */
export const allowButton = (page: Page) =>
  page.getByRole('button', { name: 'Allow', exact: true });

export const denyButton = (page: Page) =>
  page.getByRole('button', { name: 'Deny', exact: true });

/** Answer the consent screen the login (or sign-up) leads to with "Allow". */
export async function allowAccess(page: Page) {
  await expect(consentHeading(page)).toBeVisible();
  await allowButton(page).click();
}

/** Answer the consent screen with "Deny". */
export async function denyAccess(page: Page) {
  await expect(consentHeading(page)).toBeVisible();
  await denyButton(page).click();
}
