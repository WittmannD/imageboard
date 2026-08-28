import { type LoaderFunction, Outlet, redirectDocument } from 'react-router';
import { buildAuthorizationUrl } from 'src/.server/helpers/oidc.ts';
import { getOidcSessionFromCookie, oidcSession } from 'src/.server/session/oidc-session.server.ts';

export const loader: LoaderFunction = async ({ request, url }) => {
  const searchParams = url.searchParams;
  const session = await getOidcSessionFromCookie(request);

  if (searchParams.has('uid') && session.has('state')) {
    // OIDC auth flow is already in progress
    return;
  }

  const { url: authUrl, ...state } = await buildAuthorizationUrl();
  console.log('authUrl', authUrl.href);
  session.set('state', { ...state, returnTo: searchParams.get('returnTo') });

  return redirectDocument(authUrl.href, {
    headers: {
      'Set-Cookie': await oidcSession.commitSession(session),
    },
  });
};

function AuthInteractionLayout() {
  return <Outlet />;
}

export default AuthInteractionLayout;
