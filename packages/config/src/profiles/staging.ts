import type { ProfileOverrides } from '../schema.js';

/**
 * The staging server (docker-compose.staging.yaml), deployed by
 * .github/workflows/deploy-staging.yml. Served over HTTPS with a Let's Encrypt
 * certificate; keeps its data between deploys and seeds it once.
 */
export const staging: ProfileOverrides = {
  env: 'staging',
  domain: 'staging.spottish.website',
  scheme: 'https',
  imageServerUrl: 'https://imageboard-staging.s3.filebase.io',
  database: {
    dropSchema: false,
    seed: true,
  },
  identityProvider: {
    oidc: {
      client: { id: 'imageboard-staging-client' },
    },
  },
  imageProcessor: {
    s3: { bucket: 'imageboard-staging' },
  },
};
