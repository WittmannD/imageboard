import { createCookieSessionStorage } from 'react-router';
import { config, secrets } from 'src/.server/config.ts';
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
    maxAge: config.client.sessionMaxAgeSec,
    path: '/',
    sameSite: 'lax',
    secrets: [secrets.SESSION_COOKIE_SECRET],
    // Browsers drop Secure cookies set over plain HTTP (dev, e2e).
    secure: config.scheme === 'https',
  },
});

export const getUserSessionFromCookie = (request: Request) =>
  userSessionStorage.getSession(request.headers.get('Cookie'));

export const toUserSessionState = (data: TokenResponseModel): UserSession => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  idToken: data.id_token,
  sub: data.claims.sub,
  email: data.claims.email,
  emailVerified: data.claims.email_verified,
});

