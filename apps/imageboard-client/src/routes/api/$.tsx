import type {
  ActionFunction,
  LoaderFunction,
} from 'react-router';
import { authSession, getAuthSessionFromCookie } from 'src/.server/session/auth-session.server.ts';
import { refreshTokenGrant } from 'src/.server/helpers/oidc.ts';

const apiUrl = new URL(process.env['IMAGEBOARD_API_URL']);
const includeResponseHeaderKeys: string[] = ['Content-Type', 'Cache-Control', 'ETag', 'Last-Modified'];
const excludeRequestHeaderKeys: string[] = [];

function filterHeaders(headers: Headers, keys: string[] = [], mode: 'include' | 'exclude' = 'include') {
  const filteredHeaders = mode === 'include' ? new Headers(headers) : new Headers();

  for (const [key, value] of headers) {
    if (~keys.findIndex((k) => k.toLowerCase() === key.toLowerCase())) {
      if (mode === 'include')
        filteredHeaders.set(key, value);
      else
        filteredHeaders.delete(key);
    }
  }

  return filteredHeaders;
}

async function apiRequest(endpoint: string, request: Request, accessToken?: string) {
  const requestHeaders = filterHeaders(request.headers, excludeRequestHeaderKeys, 'exclude');

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const options = {
    method: request.method,
    headers: requestHeaders,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : request.body,
    duplex: 'half' as const,
  };
  const url = new URL(endpoint, apiUrl.origin);

  return await fetch(url.href, options);
}

async function proxy(request: Request, endpoint: string = '/') {
  const session = await getAuthSessionFromCookie(request);
  const tokens = session.get('state');

  let response = await apiRequest(endpoint, request, tokens?.accessToken);
  const responseHeaders = filterHeaders(response.headers, includeResponseHeaderKeys, 'include');

  if (response.status === 401 && tokens) {
    const result = await refreshTokenGrant(tokens.refreshToken);

    response = await apiRequest(endpoint, request, result.access_token);

    if (result.access_token && result.refresh_token) {
      session.set('state', {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });

      responseHeaders.set(
        'Set-Cookie',
        await authSession.commitSession(session),
      );
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
