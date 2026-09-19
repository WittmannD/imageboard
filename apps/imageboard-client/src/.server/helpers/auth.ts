import { getUserSessionFromCookie } from '../session/user-session.server.js';

export interface AuthData {
  isLoggedIn: boolean;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
}

export async function getAuth(request: Request): Promise<AuthData> {
  const userSession = await getUserSessionFromCookie(request);
  const userState = userSession.get('state');

  if (!userState) {
    return { isLoggedIn: false };
  }

  return {
    isLoggedIn: true,
    user: {
      id: userState.sub,
      emailVerified: userState.emailVerified,
      email: userState.email,
    },
  };
}
