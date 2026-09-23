import { Logger } from '@nestjs/common';
import Keyv from 'keyv';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InvalidResetTokenError } from './errors/invalid-reset-token-error.js';
import { PasswordResetService } from './password-reset.service.js';

const USER = { id: 'user-1', email: 'user@example.test' };

function build({ ttl = 60_000, cooldown = 60_000 } = {}) {
  const settings: Record<string, unknown> = {
    'identityProvider.passwordReset.tokenTtlMs': ttl,
    'identityProvider.passwordReset.requestCooldownMs': cooldown,
    'urls.interactions': 'http://client.test/auth/',
  };
  const userService = {
    findOneByEmail: vi.fn().mockResolvedValue(USER),
    findOneById: vi.fn().mockResolvedValue(USER),
    generateId: () => 'decoy',
    markPasswordReset: vi.fn().mockResolvedValue(true),
  };
  const credentialsService = {
    updatePasswordForUser: vi.fn().mockResolvedValue(true),
  };
  const emailService = {
    sendFromTemplate: vi.fn().mockResolvedValue(undefined),
  };
  const tx = {
    withManager: (_em: unknown, cb: (em: unknown) => Promise<unknown>) =>
      cb({}),
  };

  const service = new PasswordResetService(
    { getOrThrow: (key: string) => settings[key] } as never,
    new Keyv() as never,
    tx as never,
    userService as never,
    credentialsService as never,
    emailService as never,
  );

  /** The token from the nth reset email, read the way a user's browser would. */
  const tokenFromEmail = (call = 0) => {
    const variables = emailService.sendFromTemplate.mock.calls[call]?.[1] as {
      link: string;
    };
    const link = new URL(variables.link);

    return { link, token: new URLSearchParams(link.hash.slice(1)).get('token')! };
  };

  return { service, userService, credentialsService, emailService, tokenFromEmail };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('PasswordResetService', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emails a link that keeps the token in the fragment, not the query', async () => {
    const { service, emailService, tokenFromEmail } = build();

    await service.requestReset(USER.email);

    expect(emailService.sendFromTemplate).toHaveBeenCalledOnce();
    expect(emailService.sendFromTemplate.mock.calls[0]?.[2]).toMatchObject({
      to: USER.email,
      subject: 'Reset your password',
    });

    const { link, token } = tokenFromEmail();
    expect(link.origin + link.pathname).toBe(
      'http://client.test/auth/reset-password',
    );
    expect(link.search).toBe('');
    expect(token).toHaveLength(43);
  });

  it('sends nothing, and does not throw, for an unknown email', async () => {
    const { service, userService, emailService } = build();
    userService.findOneByEmail.mockResolvedValue(null);

    await expect(service.requestReset('nobody@example.test')).resolves.toBeUndefined();
    expect(emailService.sendFromTemplate).not.toHaveBeenCalled();
  });

  it('resets the password, verifies the email and confirms by email', async () => {
    const { service, credentialsService, userService, emailService, tokenFromEmail } =
      build();

    await service.requestReset(USER.email);
    await service.completeReset(tokenFromEmail().token, 'a-new-password');

    expect(credentialsService.updatePasswordForUser).toHaveBeenCalledWith(
      USER.id,
      'a-new-password',
      expect.anything(),
    );
    expect(userService.markPasswordReset).toHaveBeenCalledWith(
      USER.id,
      expect.anything(),
    );
    expect(emailService.sendFromTemplate).toHaveBeenLastCalledWith(
      expect.any(String),
      {},
      { subject: 'Your password was changed', to: USER.email },
    );
  });

  it('spends the token: a second use is rejected', async () => {
    const { service, credentialsService, tokenFromEmail } = build();

    await service.requestReset(USER.email);
    const { token } = tokenFromEmail();

    await service.completeReset(token, 'a-new-password');
    await expect(service.completeReset(token, 'another-password')).rejects.toBeInstanceOf(
      InvalidResetTokenError,
    );
    expect(credentialsService.updatePasswordForUser).toHaveBeenCalledOnce();
  });

  it('lets only one of two simultaneous submissions win', async () => {
    const { service, credentialsService, tokenFromEmail } = build();

    await service.requestReset(USER.email);
    const { token } = tokenFromEmail();

    const results = await Promise.allSettled([
      service.completeReset(token, 'a-new-password'),
      service.completeReset(token, 'a-new-password'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(credentialsService.updatePasswordForUser).toHaveBeenCalledOnce();
  });

  it('rejects an unknown token', async () => {
    const { service } = build();

    await expect(service.completeReset('nope', 'a-new-password')).rejects.toBeInstanceOf(
      InvalidResetTokenError,
    );
  });

  it('rejects an expired token', async () => {
    const { service, tokenFromEmail } = build({ ttl: 50 });

    await service.requestReset(USER.email);
    await sleep(120);

    await expect(
      service.completeReset(tokenFromEmail().token, 'a-new-password'),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
  });

  it('does not send a second email inside the cooldown', async () => {
    const { service, emailService } = build();

    await service.requestReset(USER.email);
    await service.requestReset(USER.email);

    expect(emailService.sendFromTemplate).toHaveBeenCalledOnce();
  });

  it('replaces the old link when a new one is requested after the cooldown', async () => {
    const { service, emailService, tokenFromEmail } = build({ cooldown: 50 });

    await service.requestReset(USER.email);
    await sleep(80);
    await service.requestReset(USER.email);

    expect(emailService.sendFromTemplate).toHaveBeenCalledTimes(2);
    await expect(
      service.completeReset(tokenFromEmail(0).token, 'a-new-password'),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
    await expect(
      service.completeReset(tokenFromEmail(1).token, 'a-new-password'),
    ).resolves.toBeUndefined();
  });

  it('does not fail the request when the email cannot be sent', async () => {
    const { service, emailService } = build();
    emailService.sendFromTemplate.mockRejectedValue(new Error('smtp down'));

    await expect(service.requestReset(USER.email)).resolves.toBeUndefined();
    await sleep(0);
  });
});
