let redirecting = false;

/**
 * Send the browser to the login page, once per page load.
 *
 * Several things can notice at the same moment that a visitor isn't signed in
 * (every `useAuth(true)` on the page, the API's 401 for the data it asked
 * for). Each trip through `/auth/login` starts its own authorization request
 * and overwrites the single PKCE cookie, so with more than one in flight the
 * browser follows one request while the cookie holds another's verifier - and
 * the sign-in then fails at the callback with `invalid_grant`.
 *
 * The page is replaced by a document navigation, so the flag never needs
 * resetting.
 */
export function redirectToLogin(returnTo: string): void {
  if (redirecting) {
    return;
  }
  redirecting = true;

  const loginUrl = new URL('/auth/login', window.location.origin);
  loginUrl.searchParams.set('returnTo', returnTo);

  window.location.replace(loginUrl.href);
}
