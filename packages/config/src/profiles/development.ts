import type { ProfileOverrides } from '../schema.js';

/** The local Docker stack (docker-compose.yaml). */
export const development: ProfileOverrides = {
  env: 'development',
  domain: 'spottish.website',
  imageServerUrl: 'https://imageboard.s3.filebase.io',

  identityProvider: {
    debug: 'oidc-provider*',
    oidc: {
      client: {
        // Vite dev servers run outside Docker.
        extraRedirectUris: [
          'http://localhost:5173/auth/callback',
          'http://localhost:5174/auth/callback',
        ],
        extraPostLogoutRedirectUris: [
          'http://localhost:5173/',
          'http://localhost:5174/',
        ],
      },
    },
  },
};
