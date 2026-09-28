import type { ProfileOverrides } from '../schema.js';

export const production: ProfileOverrides = {
  env: 'production',
  domain: 'spottish.website',
  scheme: 'https',
  imageServerUrl: 'https://imageboard.s3.filebase.io',
  database: {
    dropSchema: false,
  },
};
