import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { jwtVerify } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionService } from '@hdotu1/database-common';

import { FederatedCredentialsService } from '../federated-credentials/federated-credentials.service.js';
import { UserService } from '../user/service/user.service.js';
import { AuthService } from './auth.service.js';
import { AuthServiceError } from './errors/auth-service-error.js';

vi.mock('jose', async (importOriginal) => ({
  ...(await importOriginal<typeof import('jose')>()),
  jwtVerify: vi.fn(),
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
    ).rejects.toBeInstanceOf(AuthServiceError);
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
    ).rejects.toBeInstanceOf(AuthServiceError);
  });

  it('accepts an already-verified email regardless of the skip flag', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { ...claims, email_verified: true },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(
      service.validateAccessToken('token', false),
    ).resolves.toMatchObject({ id: 1 });
  });
});
