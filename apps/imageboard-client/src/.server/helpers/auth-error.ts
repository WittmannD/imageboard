import type { AuthError } from '../../schemas/auth-error.schema.ts';

export const buildAuthErrorUrl = (error: AuthError) => {
  const encodedError = Buffer.from(JSON.stringify(error)).toString('base64url');

  return `/auth/error?error=${encodedError}`;
};
