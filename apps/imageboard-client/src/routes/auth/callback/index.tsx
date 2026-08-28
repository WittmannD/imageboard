import { type LoaderFunction, redirect, useSearchParams } from 'react-router';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import {
  authorizationCodeGrant,
  getUserInfo,
} from 'src/.server/helpers/oidc.ts';
import {
  authSession,
  getAuthSessionFromCookie,
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

  console.log('claims', claims);

  if (
    result['error'] ||
    !result.access_token ||
    !result.refresh_token ||
    !claims
  ) {
    const errorUrl = buildAuthErrorUrl({
      error:
        typeof result['error'] === 'string' ? result['error'] : 'access_denied',
    });
    return redirect(errorUrl);
  }

  const auth = await getAuthSessionFromCookie(request);
  auth.set('state', {
    sub: claims.sub,
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  });

  const headers = new Headers();
  headers.append('Set-Cookie', await authSession.commitSession(auth));
  headers.append('Set-Cookie', await oidcSession.destroySession(oidc));

  const userInfo = await getUserInfo(result.access_token, claims.sub);
  const redirectTo = userInfo.email_verified
    ? (oidcState.returnTo ?? '/')
    : '/profile/email-verification';

  return redirect(redirectTo, {
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
