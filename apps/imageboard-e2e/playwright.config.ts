import { defineConfig, devices } from '@playwright/test';

import { env } from './src/env.js';

const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './tests',
  globalSetup: './src/global-setup.ts',

  // Tests are isolated by construction: each worker signs up its own user and
  // every test generates unique data, so files and tests can run in parallel.
  fullyParallel: true,
  workers: isCI ? 2 : undefined,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: env.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: [`--host-resolver-rules=${env.hostResolverRules}`],
    },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
