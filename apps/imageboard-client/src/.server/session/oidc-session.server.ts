import { createCookieSessionStorage } from 'react-router';
import { config, secrets } from 'src/.server/config.ts';
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
    maxAge: config.client.sessionMaxAgeSec,
    path: '/',
    sameSite: 'lax',
    secrets: [secrets.SESSION_COOKIE_SECRET],
    // Browsers drop Secure cookies set over plain HTTP (dev, e2e).
    secure: config.scheme === 'https',
  },
});

export const getOidcSessionFromCookie = (request: Request) => oidcSession.getSession(request.headers.get('Cookie'));