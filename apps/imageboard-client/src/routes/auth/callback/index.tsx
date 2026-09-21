import { type LoaderFunction, redirect } from 'react-router';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import { authorizationCodeGrant } from 'src/.server/helpers/oidc.ts';
import {
  userSessionStorage,
  getUserSessionFromCookie,
  toUserSessionState,
} from 'src/.server/session/user-session.server.ts';
import { buildAuthErrorUrl } from 'src/.server/helpers/auth-error.ts';

export const loader: LoaderFunction = async ({ request, url }) => {
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');

  if (!oidcState) {
    return redirect('/');
  }
  // The provider sends the user back with an error instead of a code when
  // the authorization was refused, e.g. they declined on the consent screen.
  const error = url.searchParams.get('error');

  if (error) {
    return redirect(
      buildAuthErrorUrl({
        error,
        error_description:
          url.searchParams.get('error_description') ?? undefined,
      }),
      { headers: { 'Set-Cookie': await oidcSession.destroySession(oidc) } },
    );
  }

  // validate authorization code from url and get access token
  const result = await authorizationCodeGrant(url, oidcState);

  if (!result.valid) {
    const errorUrl = buildAuthErrorUrl({
      error: 'server_error',
      error_description: 'The identity provider returned an invalid response',
    });
    return redirect(errorUrl);
  }

  const user = await getUserSessionFromCookie(request);
  user.set('state', toUserSessionState(result.data));

  const headers = new Headers();
  headers.append('Set-Cookie', await userSessionStorage.commitSession(user));
  headers.append('Set-Cookie', await oidcSession.destroySession(oidc));

  const returnTo = oidcState.returnTo ?? '/';
  const redirectTo = result.data.claims.email_verified
    ? returnTo
    : `/users/email-verification?returnTo=${encodeURIComponent(returnTo)}`;

  return redirect(redirectTo, {
    headers,
  });
};

function AuthCallbackPage() {
  return null;
}

export default AuthCallbackPage;
