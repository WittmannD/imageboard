import { env } from '../../src/env.js';
import { expect, test } from '../../src/fixtures.js';
import { createTestImages } from '../../src/support/images.js';
import { waitForHydration } from '../../src/support/page.js';

// Signed in as this worker's verified user (see src/fixtures.ts).
test('a new post is processed, published and rendered in the feed', async ({
  page,
  user,
}) => {
  const images = createTestImages();

  await page.goto('/posts/create');
  // A file chosen before hydration never reaches the form state.
  await waitForHydration(page);
  await page.locator('input[type="file"]').setInputFiles(images);
  await page.getByLabel('Caption').fill('Posted by the e2e suite');

  const created = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/posts',
  );
  await page.getByRole('button', { name: 'Publish' }).click();
  expect((await created).status()).toBe(201);

  // The API answers with a draft straight away; a post only reaches the feed
  // once every image has been laid out, resized and uploaded. That takes
  // however long it takes, so re-check the feed instead of sleeping.
  // (Cards show the author's username, not the caption, hence the filter.)
  const tiles = page
    .locator('[data-slot="card"]')
    .filter({ hasText: user.username })
    .locator('[data-slot="card-image"] img');

  await expect(async () => {
    await page.goto('/');
    await expect(tiles).toHaveCount(images.length, { timeout: 3_000 });
  }).toPass({ timeout: 90_000, intervals: [1_000, 2_000, 5_000] });

  // Every tile must actually have loaded from the object store.
  await expect(tiles.first()).toHaveAttribute(
    'src',
    new RegExp(`^${env.imageServerUrl}/`),
  );
  await expect
    .poll(() =>
      tiles.evaluateAll((elements) =>
        elements.every(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
});
