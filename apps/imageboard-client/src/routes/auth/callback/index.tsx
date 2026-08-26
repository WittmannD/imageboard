import { type LoaderFunction, redirect, useSearchParams } from 'react-router';
import {
  getOidcSessionFromCookie,
  oidcSession,
} from 'src/.server/session/oidc-session.server.ts';
import { authorizationCodeGrant } from 'src/.server/oidc.ts';
import {getAuthSessionFromCookie } from "src/.server/session/auth-session.server.ts";

export const loader: LoaderFunction = async ({ request, url }) => {
  const searchParams = url.searchParams;
  const oidc = await getOidcSessionFromCookie(request);
  const oidcState = oidc.get('state');

  if (!searchParams.has('uid') || !oidcState) {
    // OIDC auth flow is already in progress
    return redirect('/');
  }

  const result = await authorizationCodeGrant(url, oidcState);
  await oidcSession.destroySession(oidc);

  if (result['error']) return redirect(
    `/auth/error?error=${result['error']}&error_description=${result['error_description']}`,
  )

  if (!result.access_token || !result.refresh_token) return redirect('/auth/error?error=access_denied');

  const returnTo = oidcState.returnTo ?? '/';

  const auth = await getAuthSessionFromCookie(request);
  auth.set('state', {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  })

  return redirect(returnTo, {
    headers: {
      'Set-Cookie': await oidcSession.commitSession(oidc),
    }
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
