import { createCookieSessionStorage } from 'react-router';
import type { OidcAuthState } from 'src/.server/interfaces.ts';

export interface OidcSessionData {
  state: OidcAuthState
}

export interface OidcSessionFlashData {
  error: string;
}

export const OIDC_SESSION_KEY = 'oidc-session';

export const oidcSession = createCookieSessionStorage<
  OidcSessionData,
  OidcSessionFlashData
>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: {
    name: OIDC_SESSION_KEY,

    httpOnly: true,
    maxAge: Number(process.env.OIDC_SESSION_MAX_AGE),
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_COOKIE_SECRET],
    //secure: true,
  },
});

export const getOidcSessionFromCookie = (request: Request) => oidcSession.getSession(request.headers.get('Cookie'));