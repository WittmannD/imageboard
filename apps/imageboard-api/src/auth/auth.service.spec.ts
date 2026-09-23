import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { errors as joseErrors, jwtVerify } from 'jose';
import * as oidcClient from 'openid-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionService } from '@hdotu1/database-common';

import { FederatedCredentialsService } from '../federated-credentials/federated-credentials.service.js';
import { UsernameGenerationError } from '../user/errors/user-service-error.js';
import { UserService } from '../user/service/user.service.js';
import { AuthService } from './auth.service.js';
import {
  AccessTokenExpiredError,
  AuthProviderUnavailableError,
  EmailNotVerifiedError,
  InvalidAccessTokenError,
  OrphanedFederatedCredentialError,
  UserProvisioningError,
} from './errors/auth-service-error.js';

vi.mock('jose', async (importOriginal) => ({
  ...(await importOriginal<typeof import('jose')>()),
  jwtVerify: vi.fn(),
}));
vi.mock('openid-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('openid-client')>()),
  discovery: vi.fn(),
}));

const ISSUER = 'https://idp.test';
const AUDIENCE = 'https://api.test';

describe('AuthService', () => {
  let service: AuthService;
  const federatedCredentialService = {
    findOneByIssuerAndSubject: vi.fn(),
    createOrFindForUser: vi.fn(),
  };
  const userService = {
    findOneById: vi.fn(),
    createWithUsernameOrFindUser: vi.fn(),
  };
  const config = {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'urls.auth') return ISSUER;
      if (key === 'urls.api') return AUDIENCE;
      if (key === 'identityProvider.oidc.client.id') return 'client-id';
      throw new Error(`unexpected config key: ${key}`);
    }),
  };

  const claims = {
    sub: 'user-1',
    email: 'alice@example.com',
    email_verified: false,
    preferred_username: 'alice',
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    config.getOrThrow.mockImplementation((key: string) => {
      if (key === 'urls.auth') return ISSUER;
      if (key === 'urls.api') return AUDIENCE;
      if (key === 'identityProvider.oidc.client.id') return 'client-id';
      throw new Error(`unexpected config key: ${key}`);
    });
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: claims,
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);
    federatedCredentialService.findOneByIssuerAndSubject.mockResolvedValue({
      userId: 1,
    });
    userService.findOneById.mockResolvedValue({ id: 1, username: 'alice' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: config },
        { provide: UserService, useValue: userService },
        {
          provide: FederatedCredentialsService,
          useValue: federatedCredentialService,
        },
        { provide: TransactionService, useValue: { withManager: (_: unknown, cb: (m: unknown) => unknown) => cb(undefined) } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    // Bypass onModuleInit's real JWKS discovery - jwtVerify is mocked, so
    // the JWKS value itself is never actually used, only checked for truthiness.
    (service as unknown as { jwks: unknown }).jwks = {};
  });

  it('rejects an unverified email when verification is not skipped', async () => {
    await expect(
      service.validateAccessToken('token', false),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it('accepts an unverified email when verification is skipped', async () => {
    await expect(
      service.validateAccessToken('token', true),
    ).resolves.toMatchObject({ id: 1 });
  });

  it('still rejects a payload missing other required claims when verification is skipped', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { ...claims, sub: undefined },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(
      service.validateAccessToken('token', true),
    ).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  it('accepts an already-verified email regardless of the skip flag', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { ...claims, email_verified: true },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(
      service.validateAccessToken('token', false),
    ).resolves.toMatchObject({ id: 1 });
  });

  it('rejects a payload that is both unverified and malformed as invalid, not unverified', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { ...claims, email: 'not-an-email' },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(
      service.validateAccessToken('token', false),
    ).rejects.toBeInstanceOf(InvalidAccessTokenError);
  });

  describe('token verification errors', () => {
    it.each([
      ['an expired token', new joseErrors.JWTExpired('expired', {}), AccessTokenExpiredError],
      ['a bad signature', new joseErrors.JWSSignatureVerificationFailed(), InvalidAccessTokenError],
      ['an unknown signing key', new joseErrors.JWKSNoMatchingKey(), InvalidAccessTokenError],
      ['a JWKS fetch timeout', new joseErrors.JWKSTimeout(), AuthProviderUnavailableError],
      ['a non-200 JWKS response', new joseErrors.JOSEError('Expected 200 OK'), AuthProviderUnavailableError],
      ['a network failure', new TypeError('fetch failed'), AuthProviderUnavailableError],
    ])('maps %s', async (_, error, expected) => {
      vi.mocked(jwtVerify).mockRejectedValue(error);

      const rejection = service.validateAccessToken('token', true);

      await expect(rejection).rejects.toBeInstanceOf(expected);
      await expect(rejection).rejects.toMatchObject({ cause: error });
    });

    it('does not report an expired token as generically invalid only', async () => {
      vi.mocked(jwtVerify).mockRejectedValue(new joseErrors.JWTExpired('expired', {}));

      // AccessTokenExpiredError is also an InvalidAccessTokenError, so callers
      // that only know about the latter still treat it as a bad token
      await expect(
        service.validateAccessToken('token', true),
      ).rejects.toBeInstanceOf(InvalidAccessTokenError);
    });
  });

  describe('JWKS discovery', () => {
    beforeEach(() => {
      (service as unknown as { jwks: unknown }).jwks = null;
    });

    it('does not fail startup when the identity provider is down', async () => {
      vi.mocked(oidcClient.discovery).mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });

    it('reports an unreachable identity provider as unavailable', async () => {
      vi.mocked(oidcClient.discovery).mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.validateAccessToken('token', true),
      ).rejects.toBeInstanceOf(AuthProviderUnavailableError);
    });

    it('retries discovery on the next request once the provider is back', async () => {
      vi.mocked(oidcClient.discovery)
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({
          serverMetadata: () => ({ jwks_uri: 'https://idp.test/jwks' }),
        } as unknown as Awaited<ReturnType<typeof oidcClient.discovery>>);

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      await expect(
        service.validateAccessToken('token', true),
      ).resolves.toMatchObject({ id: 1 });
      expect(oidcClient.discovery).toHaveBeenCalledTimes(2);
    });
  });

  describe('user lookup errors', () => {
    it('reports a credential pointing at a missing user', async () => {
      userService.findOneById.mockResolvedValue(null);

      await expect(
        service.validateAccessToken('token', true),
      ).rejects.toBeInstanceOf(OrphanedFederatedCredentialError);
    });

    it('wraps a failure to create the user on first sign-in', async () => {
      federatedCredentialService.findOneByIssuerAndSubject.mockResolvedValue(null);
      userService.createWithUsernameOrFindUser.mockRejectedValue(
        new UsernameGenerationError(),
      );

      await expect(
        service.validateAccessToken('token', true),
      ).rejects.toBeInstanceOf(UserProvisioningError);
    });
  });
});
