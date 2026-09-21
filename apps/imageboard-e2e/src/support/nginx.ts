import http from 'node:http';

import { env } from '../env.js';

export interface ViaResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

export interface ViaOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Request `path` on the nginx front door, presenting `host` as the virtual
 * host. The stack's hostnames (`e2e.test`, `auth.e2e.test`, ...) only resolve
 * inside Chromium (see `hostResolverRules` in env.ts), so anything the test
 * process itself calls has to go to 127.0.0.1 and name the host explicitly.
 * Redirects are not followed.
 */
export function requestVia(
  host: string,
  path: string,
  { method = 'GET', headers, body, timeout = 5_000 }: ViaOptions = {},
): Promise<ViaResponse> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port: env.httpPort,
        path,
        method,
        headers: {
          Host: host,
          // Without a length Node falls back to chunked encoding, even for an
          // empty POST.
          ...(body === undefined && method === 'GET'
            ? {}
            : { 'Content-Length': String(Buffer.byteLength(body ?? '')) }),
          ...headers,
        },
        timeout,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('error', reject);
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error('timed out'));
    });
    request.on('error', reject);
    request.end(body);
  });
}
