import { type LoaderFunction, redirect, useSearchParams } from 'react-router';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import { authorizationCodeGrant } from 'src/.server/oidc.ts';
import {
  authSession,
  getAuthSessionFromCookie,
} from 'src/.server/session/auth-session.server.ts';

export const loader: LoaderFunction = async ({ request, url }) => {
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');

  if (!oidcState) {
    return redirect('/');
  }
  // validate authorization code from url and get access token
  const result = await authorizationCodeGrant(url, oidcState);

  if (result['error'])
    return redirect(
      `/auth/error?error=${result['error']}&error_description=${result['error_description']}`,
    );

  if (!result.access_token || !result.refresh_token)
    return redirect('/auth/error?error=access_denied');

  const returnTo = oidcState.returnTo ?? '/';

  const auth = await getAuthSessionFromCookie(request);
  auth.set('state', {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  });

  const headers = new Headers();
  headers.append('Set-Cookie', await authSession.commitSession(auth));
  headers.append('Set-Cookie', await oidcSession.destroySession(oidc));

  return redirect(returnTo, {
    headers,
  });
};

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();

  return (
    <div>
      <code>
        <pre>
          {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
        </pre>
      </code>
    </div>
  );
}

export default AuthCallbackPage;
