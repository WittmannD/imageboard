import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Keyv from 'keyv';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../email/email.service.js';
import { KEYV_STORE } from '../keyv-store/keyv-store.provider.js';
import { UserService } from '../user/user.service.js';
import { VerificationController } from './verification.controller.js';
import { VerificationService } from './verification.service.js';

const USER = {
  id: '6f1c2f6e-3b0e-4a8e-9d4b-2f6f7f9a1c11',
  email: 'user@example.test',
  emailVerified: false,
};

// Drives the real controller and service over HTTP: what the client's
// server sees on the wire is the contract, not the service's return value.
describe('VerificationController', () => {
  let app: INestApplication;
  let base: string;
  const userService = {
    findOneById: vi.fn(),
    markEmailVerified: vi.fn(),
    generateId: () => 'decoy',
  };
  const emailService = { sendFromTemplate: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    userService.findOneById.mockResolvedValue(USER);
    userService.markEmailVerified.mockResolvedValue(true);
    emailService.sendFromTemplate.mockResolvedValue(undefined);

    const settings: Record<string, number> = {
      'identityProvider.verification.sessionTtlMs': 60_000,
      'identityProvider.verification.resendCooldownMs': 60_000,
      'identityProvider.verification.otpSaltRounds': 4,
    };
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [VerificationController],
      providers: [
        VerificationService,
        { provide: ConfigService, useValue: { getOrThrow: (k: string) => settings[k] } },
        { provide: KEYV_STORE, useValue: new Keyv() },
        { provide: UserService, useValue: userService },
        { provide: EmailService, useValue: emailService },
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
    fetch(`${base}/verification${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  /** Request a code and read it the way the user would: from the email. */
  async function requestCode() {
    const res = await post('', { userId: USER.id });
    const { sessionId } = (await res.json()) as { sessionId: string };
    const variables = emailService.sendFromTemplate.mock.calls[0]?.[1] as {
      otp: string;
    };

    return { sessionId, otp: variables.otp };
  }

  it('hands back the session and when a resend is allowed', async () => {
    const res = await post('', { userId: USER.id });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      sessionId: expect.any(String),
      resendAvailableAt: expect.any(Number),
    });
  });

  it('answers the correct code with { verified: true }', async () => {
    const { sessionId, otp } = await requestCode();

    const res = await post('/complete', { sessionId, otp });

    // The client reads `verified` off this body; anything else looks like a
    // rejected code to the user.
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ verified: true });
    expect(userService.markEmailVerified).toHaveBeenCalledWith(USER.id);
  });

  it('reports { verified: false } when the account no longer exists', async () => {
    const { sessionId, otp } = await requestCode();
    userService.markEmailVerified.mockResolvedValue(false);

    const res = await post('/complete', { sessionId, otp });

    expect(await res.json()).toEqual({ verified: false });
  });

  it('rejects a wrong code with 410 invalid_verification_otp', async () => {
    const { sessionId, otp } = await requestCode();

    const res = await post('/complete', {
      sessionId,
      otp: otp === '000000' ? '111111' : '000000',
    });

    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({
      errorCode: 'invalid_verification_otp',
    });
    expect(userService.markEmailVerified).not.toHaveBeenCalled();
  });

  it('rejects an unknown session', async () => {
    const res = await post('/complete', { sessionId: 'nope', otp: '123456' });

    expect(res.status).toBe(410);
  });

  it('spends the code: a second use is rejected', async () => {
    const { sessionId, otp } = await requestCode();

    await post('/complete', { sessionId, otp });
    const again = await post('/complete', { sessionId, otp });

    expect(again.status).toBe(410);
    expect(userService.markEmailVerified).toHaveBeenCalledOnce();
  });
});
