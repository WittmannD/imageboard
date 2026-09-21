import type { Cookie } from '@playwright/test';

import { env } from '../env.js';
import { requestVia } from './nginx.js';

/** The client's own session (holds the tokens), set on the app's origin. */
const APP_SESSION_COOKIE = 'auth-session';
/** oidc-provider's login session (`_session` plus its `.sig`), set on the auth host. */
const PROVIDER_SESSION_COOKIE = /^_session/;

const isOnAuthHost = (cookie: Cookie) =>
  cookie.domain.replace(/^\./, '') === env.authHost;

export const appSessionCookie = (cookies: Cookie[]) =>
  cookies.find((cookie) => cookie.name === APP_SESSION_COOKIE);

export const providerSessionCookies = (cookies: Cookie[]) =>
  cookies.filter(
    (cookie) => isOnAuthHost(cookie) && PROVIDER_SESSION_COOKIE.test(cookie.name),
  );

/**
 * The refresh token inside the client's session cookie. The cookie is
 * react-router's signed cookie session: `<base64(utf8 JSON)>.<signature>`,
 * URL-encoded in the jar, holding `{ state: { refreshToken, ... } }`. It is
 * signed, not encrypted, so a test can read what the server put in it.
 */
export function readRefreshToken(cookies: Cookie[]): string {
  const cookie = appSessionCookie(cookies);

  if (!cookie) {
    throw new Error(
      `No "${APP_SESSION_COOKIE}" cookie - is this browser context signed in?`,
    );
  }

  const [encoded = ''] = decodeURIComponent(cookie.value).split('.');
  const data = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as {
    state?: { refreshToken?: unknown };
  };
  const token = data.state?.refreshToken;

  if (typeof token !== 'string' || token === '') {
    throw new Error(
      `The "${APP_SESSION_COOKIE}" cookie has no refresh token - its format may have changed`,
    );
  }

  return token;
}

export interface RefreshGrantResult {
  status: number;
  error?: string;
  hasAccessToken: boolean;
}

/**
 * Trade `refreshToken` at the provider's token endpoint, as the client's
 * server does. Answers 200 while the token's grant is alive, and 400
 * `invalid_grant` once it has been revoked.
 */
export async function refreshGrant(
  refreshToken: string,
): Promise<RefreshGrantResult> {
  const response = await requestVia(env.authHost, '/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.oidcClientId,
      client_secret: env.oidcClientSecret,
    }).toString(),
  });

  let json: { error?: string; access_token?: unknown };

  try {
    json = JSON.parse(response.body) as typeof json;
  } catch {
    throw new Error(
      `Token endpoint answered ${response.status} with a non-JSON body: ${response.body.slice(0, 200)}`,
    );
  }

  return {
    status: response.status,
    error: json.error,
    hasAccessToken: typeof json.access_token === 'string',
  };
}
