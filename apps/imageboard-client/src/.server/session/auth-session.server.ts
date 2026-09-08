import { createCookieSessionStorage } from 'react-router';
import type { UserSession } from 'src/.server/interfaces.ts';

export interface UserSessionData {
  state: UserSession;
}

export interface UserSessionFlashData {
  error: string;
}

export const AUTH_SESSION_KEY = 'auth-session';

export const userSession = createCookieSessionStorage<
  UserSessionData,
  UserSessionFlashData
>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: AUTH_SESSION_KEY,

    httpOnly: true,
    maxAge: Number(process.env.OIDC_SESSION_MAX_AGE),
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_COOKIE_SECRET],
    //secure: true,
  },
});

export const getUserSessionFromCookie = (request: Request) =>
  userSession.getSession(request.headers.get('Cookie'));
