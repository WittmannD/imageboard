import { createCookieSessionStorage } from 'react-router';
import type { Credentials } from 'src/.server/interfaces.ts';

export interface AuthSessionData {
  state: Credentials;
}

export interface AuthSessionFlashData {
  error: string;
}

export const AUTH_SESSION_KEY = 'auth-session';

export const authSession = createCookieSessionStorage<
  AuthSessionData,
  AuthSessionFlashData
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

export const getAuthSessionFromCookie = (request: Request) =>
  authSession.getSession(request.headers.get('Cookie'));
