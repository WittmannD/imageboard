import http from 'node:http';
import { Controller, Get, type INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getConfig } from '@hdotu1/config';

import { getCors } from './cors.js';

const CLIENT_ORIGIN = 'http://e2e.test';
const OWN_ORIGIN = 'http://auth.e2e.test';

/** How many times the POST handler actually ran - a rejected origin must not get that far. */
let postHits = 0;

@Controller('ping')
class PingController {
  @Get()
  get() {
    return { ok: true };
  }

  @Post()
  post() {
    postHits++;
    return { ok: true };
  }
}

describe('getCors', () => {
  let app: INestApplication;
  let port: number;

  beforeEach(async () => {
    postHits = 0;
    const moduleRef = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    // The e2e profile registers exactly CLIENT_ORIGIN and OWN_ORIGIN.
    app.enableCors(getCors(getConfig('e2e')));
    await app.listen(0);
    port = Number(new URL(await app.getUrl()).port);
  });

  afterEach(async () => {
    await app.close();
  });

  /** Node's fetch is free to drop `Origin`, so send the request by hand. */
  const send = (method: string, headers: Record<string, string> = {}) =>
    new Promise<{
      status: number;
      headers: http.IncomingHttpHeaders;
      body: string;
    }>((resolve, reject) => {
        const request = http.request(
          { host: '127.0.0.1', port, path: '/ping', method, headers },
          (response) => {
            const chunks: Buffer[] = [];

            response.on('data', (chunk: Buffer) => chunks.push(chunk));
            response.on('end', () => {
              resolve({
                status: response.statusCode ?? 0,
                headers: response.headers,
                body: Buffer.concat(chunks).toString('utf8'),
              });
            });
          },
        );

        request.on('error', reject);
        request.end();
      },
    );

  it('lets a registered client call with credentials', async () => {
    const response = await send('POST', { origin: CLIENT_ORIGIN });

    expect(response.status).toBe(201);
    expect(response.headers['access-control-allow-origin']).toBe(CLIENT_ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('answers a client preflight', async () => {
    const response = await send('OPTIONS', {
      origin: CLIENT_ORIGIN,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    });

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(CLIENT_ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers']).toBe('content-type');
  });

  it("lets the provider's own pages post to themselves", async () => {
    // The logout confirmation form lives on the provider and posts back to it;
    // browsers send the provider's own origin along with that POST.
    const response = await send('POST', { origin: OWN_ORIGIN });

    expect(response.status).toBe(201);
    expect(postHits).toBe(1);
  });

  it('rejects an unknown origin with 403, before the handler runs', async () => {
    const response = await send('POST', { origin: 'http://evil.test' });

    expect(response.status).toBe(403);
    expect(JSON.parse(response.body)).toMatchObject({ statusCode: 403 });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    expect(postHits).toBe(0);
  });

  it('rejects an unknown origin on a preflight too', async () => {
    const response = await send('OPTIONS', {
      origin: 'http://evil.test',
      'access-control-request-method': 'POST',
    });

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects the opaque "null" origin', async () => {
    const response = await send('POST', { origin: 'null' });

    expect(response.status).toBe(403);
    expect(postHits).toBe(0);
  });

  it('serves requests with no Origin at all (server-to-server, navigations)', async () => {
    const response = await send('GET');

    expect(response.status).toBe(200);
  });
});
