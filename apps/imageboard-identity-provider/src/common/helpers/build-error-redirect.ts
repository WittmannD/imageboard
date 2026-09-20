/**
 * Builds a redirect to the client's generic error page: {base}/error?error=<base64url json>.
 * Used both for oidc-provider's own renderError and for interaction failures
 * we can't attribute to a specific, recoverable form error.
 */
export function buildErrorRedirect(base: string, error: object): string {
  const url = new URL('error', base);
  const isProduction = process.env['NODE_ENV'] === 'production';
  const safeError = isProduction
    ? Object.fromEntries(
        Object.entries(error).filter(([key]) => key !== 'error_description'),
      )
    : error;

  const encoded = Buffer.from(JSON.stringify(safeError)).toString(
    'base64url',
  );
  url.searchParams.set('error', encoded);

  return url.href;
}
