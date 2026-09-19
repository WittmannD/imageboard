import { expect, test } from '@playwright/test';

import { SIGNUP_HEADING } from '../../src/support/auth-flow.js';

// Pages behind `useAuth(true)` must not render for anonymous visitors.
for (const path of ['/users/me', '/users/me/settings']) {
  test(`anonymous visitors opening ${path} are sent to sign in`, async ({
    page,
  }) => {
    await page.goto(path);

    // The identity provider hands the flow back to the client's interaction
    // page, identified by the `uid` of the pending authorization request.
    await expect(page).toHaveURL(/\/auth\/login\?.*\buid=/);
    await expect(page.getByText(SIGNUP_HEADING)).toBeVisible();
  });
}
