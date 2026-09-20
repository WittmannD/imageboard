import { expect, test } from '../../src/fixtures.js';
import { waitForHydration } from '../../src/support/page.js';

// Signed in as this worker's verified user (see src/fixtures.ts).
test('a log out invalidates current session and redirects on the main page', async ({
  page,
}) => {
  await page.goto('/users/me');
  await waitForHydration(page);

  await page.locator('header').getByRole('button', { name: 'Log Out' }).click();

  // RP-Initiated Logout: the identity provider confirms before it ends its
  // own session and sends the browser back.
  await page.getByRole('button', { name: 'Yes, sign me out' }).click();
  await expect(page).toHaveURL('/');

  // The local session is gone too: the protected route bounces to sign-in.
  await page.goto('/users/me');
  await expect(page).toHaveURL(/\/auth\/login\?.*\buid=/);
});
