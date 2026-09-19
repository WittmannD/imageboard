import http from 'node:http';

import { env } from './env.js';
import { pollUntil } from './support/poll.js';

/** GET `path` on the nginx front door, presenting `host` as the virtual host. */
function statusVia(host: string, path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port: env.httpPort,
        path,
        headers: { Host: host },
        timeout: 5_000,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error('timed out'));
    });
    request.on('error', reject);
    request.end();
  });
}

const checks = [
  {
    name: 'client (via nginx)',
    probe: () => statusVia(env.domain, '/'),
  },
  {
    name: 'identity provider (via nginx)',
    probe: () => statusVia(env.authHost, '/.well-known/openid-configuration'),
  },
  {
    name: 'API (via nginx)',
    probe: () => statusVia(env.apiHost, '/ip'),
  },
  {
    name: 'Mailpit',
    probe: async () => (await fetch(`${env.mailpitUrl}/api/v1/info`)).status,
  },
];

/**
 * Fails fast with an actionable message when the stack isn't up, instead of
 * letting the first test time out on a connection error.
 */
export default async function globalSetup(): Promise<void> {
  try {
    for (const { name, probe } of checks) {
      await pollUntil(
        `${name} to answer with HTTP 200`,
        async () => ((await probe()) === 200 ? true : null),
        { timeout: 30_000, interval: 1_000 },
      );
    }
  } catch (error) {
    throw new Error(
      'The e2e stack is not reachable. Start it with `npm run stack:up -w imageboard-e2e`.\n' +
        (error instanceof Error ? error.message : String(error)),
      { cause: error },
    );
  }
}
