import { type LoaderFunction, redirect } from 'react-router';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import {
  authorizationCodeGrant,
} from 'src/.server/helpers/oidc.ts';
import {
  userSession,
  getUserSessionFromCookie,
} from 'src/.server/session/auth-session.server.ts';
import { buildAuthErrorUrl } from 'src/.server/helpers/auth-error.ts';

export const loader: LoaderFunction = async ({ request, url }) => {
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');

  if (!oidcState) {
    return redirect('/');
  }
  // validate authorization code from url and get access token
  const result = await authorizationCodeGrant(url, oidcState);
  const claims = result.claims();

  if (
    result['error'] ||
    !result.access_token ||
    !result.refresh_token ||
    !claims ||
    typeof claims['email'] !== 'string' ||
    typeof claims['email_verified'] !== 'boolean'
  ) {
    const errorUrl = buildAuthErrorUrl({
      error:
        typeof result['error'] === 'string' ? result['error'] : 'access_denied',
    });
    return redirect(errorUrl);
  }

  const user = await getUserSessionFromCookie(request);
  user.set('state', {
    sub: claims.sub,
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    email: claims['email'],
    emailVerified: claims['email_verified']
  });

  const headers = new Headers();
  headers.append('Set-Cookie', await userSession.commitSession(user));
  headers.append('Set-Cookie', await oidcSession.destroySession(oidc));

  const returnTo = oidcState.returnTo ?? '/';
  const redirectTo = claims['email_verified']
    ? returnTo
    : `/profile/email-verification?returnTo=${encodeURIComponent(returnTo)}`;

  return redirect(redirectTo, {
    headers,
  });
};

function AuthCallbackPage() {
  return null;
}

export default AuthCallbackPage;
