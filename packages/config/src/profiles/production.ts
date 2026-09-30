import type { ProfileOverrides } from '../schema.js';

/**
 * The production server (docker-compose.production.yaml), deployed by
 * .github/workflows/deploy-production.yml. Served over HTTPS with a Let's
 * Encrypt certificate; keeps its data between deploys and is never seeded.
 */
export const production: ProfileOverrides = {
  env: 'production',
  domain: 'spottish.website',
  scheme: 'https',
  imageServerUrl: 'https://imageboard.s3.filebase.io',
  database: {
    dropSchema: false,
  },
  identityProvider: {
    smtp: {
      // Resend only delivers mail from a verified domain to other addresses.
      from: 'Imageboard <no-reply@spottish.website>',
    },
  },
};
