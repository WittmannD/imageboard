import type {
  ActionFunction,
  LoaderFunction,
} from 'react-router';
import { authSession, getAuthSessionFromCookie } from 'src/.server/session/auth-session.server.ts';
import { refreshTokenGrant } from 'src/.server/helpers/oidc.ts';

const apiUrl = new URL(process.env['IMAGEBOARD_API_URL']);
const includeResponseHeaderKeys: string[] = ['Content-Type', 'Retry-After', 'Cache-Control', 'ETag', 'Last-Modified'];
// hop-by-hop / connection-specific headers that must not be forwarded as-is to the upstream API
const excludeRequestHeaderKeys: string[] = ['Host', 'Connection', 'Content-Length'];

function filterHeaders(headers: Headers, keys: string[] = [], mode: 'include' | 'exclude' = 'include') {
  const filteredHeaders = new Headers(mode === 'exclude' ? headers : undefined);

  for (const [key, value] of headers) {
    const matches = keys.some((k) => k.toLowerCase() === key.toLowerCase());

    if (mode === 'include' && matches)
      filteredHeaders.set(key, value);
    else if (mode === 'exclude' && matches)
      filteredHeaders.delete(key);
  }

  return filteredHeaders;
}

async function apiRequest(endpoint: string, request: Request, body: BodyInit | undefined, accessToken?: string) {
  const requestHeaders = filterHeaders(request.headers, excludeRequestHeaderKeys, 'exclude');

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const options = {
    method: request.method,
    headers: requestHeaders,
    body,
  } satisfies RequestInit;
  const url = new URL(endpoint, apiUrl);
  return await fetch(url.href, options);
}

async function proxy(request: Request, endpoint: string = '/') {
  const session = await getAuthSessionFromCookie(request);
  const tokens = session.get('state');

  // Request.body is a ReadableStream that can only be consumed once, but a
  // 401 below needs to retry the same request with a refreshed token -
  // buffer it up front so both attempts can send it.
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  let response = await apiRequest(endpoint, request, body, tokens?.accessToken);
  let responseHeaders = filterHeaders(response.headers, includeResponseHeaderKeys, 'include');

  if (response.status === 401 && tokens) {
    // drain the response body we're about to discard - an unread body can
    // leave the underlying keep-alive connection in a bad state, causing a
    // later unrelated request to be served leftover bytes from this one
    await response.body?.cancel();

    // todo: logout if fail to refresh token
    const result = await refreshTokenGrant(tokens.refreshToken);
    const claims = result.claims();
    let setCookie: string | undefined;

    if (result.access_token && result.refresh_token && claims) {
      session.set('state', {
        sub: claims.sub,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });

      setCookie = await authSession.commitSession(session);
    }

    // retry request with new access token
    response = await apiRequest(endpoint, request, body, result.access_token);
    responseHeaders = filterHeaders(response.headers, includeResponseHeaderKeys, 'include');

    if (setCookie) {
      responseHeaders.append('Set-Cookie', setCookie);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}


export const loader: LoaderFunction = async ({ request, params }) => {
  return proxy(request, params['*']);
}

export const action: ActionFunction = async ({ request, params }) => {
  return proxy(request, params['*']);
}
