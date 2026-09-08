import { createCookieSessionStorage } from 'react-router';
import type { UserSession } from 'src/.server/interfaces.ts';
import type { TokenResponseModel } from 'src/.server/models/token-response.model.ts';

export interface UserSessionData {
  state: UserSession;
}

export interface UserSessionFlashData {
  error: string;
}

export const AUTH_SESSION_KEY = 'auth-session';

export const userSessionStorage = createCookieSessionStorage<
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
  userSessionStorage.getSession(request.headers.get('Cookie'));

export const toUserSessionState = (data: TokenResponseModel): UserSession => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  sub: data.claims.sub,
  email: data.claims.email,
  emailVerified: data.claims.email_verified,
});

