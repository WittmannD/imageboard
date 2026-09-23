import type { ProfileOverrides } from '../schema.js';

export const production: ProfileOverrides = {
  env: 'production',
  domain: 'spottish.website',
  imageServerUrl: 'https://imageboard.s3.filebase.io',
};
