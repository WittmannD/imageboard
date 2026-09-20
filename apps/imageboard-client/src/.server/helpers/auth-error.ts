export interface AuthError {
  error: string;
  error_description?: string;
}

export const buildAuthErrorUrl = (error: AuthError) => {
  const encodedError = Buffer.from(JSON.stringify(error)).toString('base64url');

  return `/auth/error?error=${encodedError}`;
};

/**
 * Decodes the `error` query param `buildAuthErrorUrl` (and the identity
 * provider's own error redirects, which use the same base64url(JSON) shape)
 * produce. The param only ever comes from our own trusted redirects, but it
 * still travels through the browser's address bar, so a visitor can hand-edit
 * it into anything - this just needs to degrade to `undefined` on garbage
 * input rather than throw, not reject specific malformed shapes.
 */
export function parseAuthError(param: string | null): AuthError | undefined {
  if (!param) {
    return undefined;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(param, 'base64url').toString('utf-8'),
    );

    if (
      decoded &&
      typeof decoded === 'object' &&
      typeof (decoded as { error?: unknown }).error === 'string'
    ) {
      const { error, error_description } = decoded as AuthError;
      return {
        error,
        error_description:
          typeof error_description === 'string' ? error_description : undefined,
      };
    }
  } catch {
    // Malformed/tampered error param - fall through to undefined.
  }

  return undefined;
}
