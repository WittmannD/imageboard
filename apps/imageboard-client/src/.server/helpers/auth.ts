import { getUserSessionFromCookie } from '../session/user-session.server.js';

export interface AuthData {
  isLoggedIn: boolean;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  urls: {
    login: string | null;
    registration: string | null;
    logout: string;
  };
}

export async function getAuth(request: Request): Promise<AuthData> {
  const userSession = await getUserSessionFromCookie(request);
  const userState = userSession.get('state');

  const issuerUrl = new URL(process.env.OIDC_ISSUER_URL);
  const uid = new URL(request.url).searchParams.get('uid');

  const urls = {
    login: uid
      ? new URL(`/interactions/${uid}/login`, issuerUrl).toString()
      : null,
    registration: uid
      ? new URL(`/interactions/${uid}/registration`, issuerUrl).toString()
      : null,
    logout: '/auth/logout',
  };

  if (!userState) {
    return { isLoggedIn: false, urls };
  }

  return {
    isLoggedIn: true,
    user: {
      id: userState.sub,
      emailVerified: userState.emailVerified,
      email: userState.email,
    },
    urls
  };
}
