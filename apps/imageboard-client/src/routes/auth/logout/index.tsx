import {
  type ActionFunction,
  type LoaderFunction,
  redirect,
  redirectDocument,
} from 'react-router';
import { buildEndSessionUrl, revokeTokens } from 'src/.server/helpers/oidc.ts';
import {
  getUserSessionFromCookie,
  userSessionStorage,
} from 'src/.server/session/user-session.server.ts';

export const loader: LoaderFunction = () => redirect('/');

export const action: ActionFunction = async ({ request }) => {
  const userSession = await getUserSessionFromCookie(request);
  const userState = userSession.get('state');

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    await userSessionStorage.destroySession(userSession),
  );

  if (!userState) {
    return redirect('/', { headers });
  }

  await revokeTokens({
    accessToken: userState.accessToken,
    refreshToken: userState.refreshToken,
  });

  const endSessionUrl = buildEndSessionUrl({
    idTokenHint: userState.idToken,
    postLogoutRedirectUri: new URL('/', process.env.VITE_BASE_URL).toString(),
  });

  return redirectDocument(endSessionUrl.href, { headers });
};

function LogoutPage() {
  return null;
}

export default LogoutPage;
