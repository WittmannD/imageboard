import { type INestApplication,ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InvalidResetTokenError } from './errors/invalid-reset-token-error.js';
import { PasswordResetController } from './password-reset.controller.js';
import { PasswordResetService } from './password-reset.service.js';

describe('PasswordResetController', () => {
  let app: INestApplication;
  let base: string;
  const service = {
    requestReset: vi.fn(),
    completeReset: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    service.requestReset.mockResolvedValue(undefined);
    service.completeReset.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [PasswordResetController],
      providers: [
        { provide: PasswordResetService, useValue: service },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_PIPE, useClass: ValidationPipe },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    base = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (path: string, body: unknown) =>
    fetch(`${base}/password-reset${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('accepts a reset request with no body back', async () => {
    const res = await post('', { email: 'a@b.co' });

    expect(res.status).toBe(204);
    expect(service.requestReset).toHaveBeenCalledWith('a@b.co');
  });

  it('rejects a malformed email with invalid_input', async () => {
    const res = await post('', { email: 'nope' });

    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('invalid_input');
    expect(service.requestReset).not.toHaveBeenCalled();
  });

  it('throttles reset requests with rate_limited', async () => {
    const statuses: number[] = [];
    let last: { errorCode?: string } = {};

    for (let i = 0; i < 4; i++) {
      const res = await post('', { email: 'a@b.co' });
      statuses.push(res.status);
      last = res.status === 429 ? await res.json() : {};
    }

    expect(statuses).toEqual([204, 204, 204, 429]);
    expect(last.errorCode).toBe('rate_limited');
  });

  it('completes a reset', async () => {
    const res = await post('/complete', {
      token: 'abc',
      password: 'a-new-password',
    });

    expect(res.status).toBe(204);
    expect(service.completeReset).toHaveBeenCalledWith('abc', 'a-new-password');
  });

  it('rejects a too-short password with invalid_input', async () => {
    const res = await post('/complete', { token: 'abc', password: 'short' });

    expect(res.status).toBe(400);
    expect((await res.json()).errorCode).toBe('invalid_input');
    expect(service.completeReset).not.toHaveBeenCalled();
  });

  it('answers a dead link with 410 invalid_reset_token', async () => {
    service.completeReset.mockRejectedValue(new InvalidResetTokenError());

    const res = await post('/complete', {
      token: 'abc',
      password: 'a-new-password',
    });

    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({
      statusCode: 410,
      errorCode: 'invalid_reset_token',
    });
  });

  it('leaves unexpected failures as a plain 500 with no error code', async () => {
    service.completeReset.mockRejectedValue(new Error('db down'));

    const res = await post('/complete', {
      token: 'abc',
      password: 'a-new-password',
    });

    expect(res.status).toBe(500);
    expect((await res.json()).errorCode).toBeUndefined();
  });
});
