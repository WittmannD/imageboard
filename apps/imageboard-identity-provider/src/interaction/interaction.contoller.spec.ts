import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { errors } from 'oidc-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CredentialsService } from '../credentials/credentials.service.js';
import { API_RESOURCE_IDENTIFIER } from '../oidc/helpers/resource-indicators.js';
import { OIDC_PROVIDER } from '../oidc/oidc.provider.js';
import { UserService } from '../user/user.service.js';
import { InteractionController } from './interaction.contoller.js';
import { InteractionService } from './interaction.service.js';

const REDIRECT = 'http://idp.test/auth/uid-2';
const SCOPES = ['openid', 'email', 'profile', 'offline_access'];

describe('InteractionController consent', () => {
  let app: INestApplication;
  let base: string;

  const grant = {
    addOIDCScope: vi.fn(),
    addResourceScope: vi.fn(),
    save: vi.fn(),
  };
  const Grant = Object.assign(vi.fn(), { find: vi.fn() });
  const oidc = {
    interactionDetails: vi.fn(),
    interactionResult: vi.fn(),
    Grant,
    Client: { find: vi.fn() },
  };
  const userService = { findOneById: vi.fn() };

  const interaction = (overrides: Record<string, unknown> = {}) => ({
    uid: 'uid-1',
    prompt: { name: 'consent', details: {} },
    session: { accountId: 'user-1' },
    params: {
      client_id: 'client-1',
      scope: 'openid email profile offline_access made_up',
    },
    ...overrides,
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    Grant.mockImplementation(function () {
      return grant;
    });
    grant.save.mockResolvedValue('grant-1');
    oidc.interactionDetails.mockResolvedValue(interaction());
    oidc.interactionResult.mockResolvedValue(REDIRECT);
    oidc.Client.find.mockResolvedValue({
      clientId: 'client-1',
      clientName: 'Imageboard',
      logoUri: 'http://client.test/logo.png',
    });
    userService.findOneById.mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [InteractionController],
      providers: [
        { provide: OIDC_PROVIDER, useValue: oidc },
        { provide: UserService, useValue: userService },
        { provide: ConfigService, useValue: {} },
        { provide: CredentialsService, useValue: {} },
        { provide: InteractionService, useValue: {} },
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

  const call = (method: 'GET' | 'POST', path: string) =>
    fetch(`${base}/interactions/uid-1/consent${path}`, { method });

  describe('GET /consent', () => {
    it('describes who asks for what, limited to the supported scopes', async () => {
      const res = await call('GET', '');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        client: {
          id: 'client-1',
          name: 'Imageboard',
          logoUri: 'http://client.test/logo.png',
        },
        account: { username: 'alice', email: 'alice@example.com' },
        scopes: SCOPES,
      });
    });

    it('falls back to the client id when the client has no name', async () => {
      oidc.Client.find.mockResolvedValue({ clientId: 'client-1' });

      const body = (await (await call('GET', '')).json()) as {
        client: { name: string };
      };

      expect(body.client.name).toBe('client-1');
    });

    it.each([
      [
        'the interaction is gone',
        () =>
          oidc.interactionDetails.mockRejectedValue(
            new errors.SessionNotFound('expired'),
          ),
      ],
      [
        'the prompt is not a consent one',
        () =>
          oidc.interactionDetails.mockResolvedValue(
            interaction({ prompt: { name: 'login', details: {} } }),
          ),
      ],
      [
        'nobody is logged in yet',
        () =>
          oidc.interactionDetails.mockResolvedValue(
            interaction({ session: undefined }),
          ),
      ],
      [
        'the account no longer exists',
        () => userService.findOneById.mockResolvedValue(null),
      ],
    ])('rejects with invalid_interaction when %s', async (_name, arrange) => {
      arrange();

      const res = await call('GET', '');

      expect(res.status).toBe(400);
      expect(((await res.json()) as { errorCode: string }).errorCode).toBe(
        'invalid_interaction',
      );
    });
  });

  describe('POST /consent', () => {
    it('grants the requested scopes and resumes the authorization', async () => {
      const res = await call('POST', '');

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ redirectTo: REDIRECT });
      expect(Grant).toHaveBeenCalledWith({
        accountId: 'user-1',
        clientId: 'client-1',
      });
      expect(grant.addOIDCScope).toHaveBeenCalledWith(SCOPES);
      expect(grant.addResourceScope).toHaveBeenCalledWith(
        API_RESOURCE_IDENTIFIER,
        SCOPES,
      );
      expect(oidc.interactionResult).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { consent: { grantId: 'grant-1' } },
      );
    });

    it('extends the grant the session already has', async () => {
      oidc.interactionDetails.mockResolvedValue(
        interaction({ grantId: 'grant-0' }),
      );
      Grant.find.mockResolvedValue(grant);

      await call('POST', '');

      expect(Grant.find).toHaveBeenCalledWith('grant-0');
      expect(Grant).not.toHaveBeenCalled();
      expect(grant.addOIDCScope).toHaveBeenCalled();
    });

    it('does not grant anything for a stale interaction', async () => {
      oidc.interactionDetails.mockResolvedValue(
        interaction({ prompt: { name: 'login', details: {} } }),
      );

      const res = await call('POST', '');

      expect(res.status).toBe(400);
      expect(grant.save).not.toHaveBeenCalled();
      expect(oidc.interactionResult).not.toHaveBeenCalled();
    });
  });

  describe('POST /consent/deny', () => {
    it('sends the client back with access_denied and grants nothing', async () => {
      const res = await call('POST', '/deny');

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ redirectTo: REDIRECT });
      expect(oidc.interactionResult).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ error: 'access_denied' }),
        { mergeWithLastSubmission: false },
      );
      expect(grant.save).not.toHaveBeenCalled();
    });

    it('rejects a stale interaction', async () => {
      oidc.interactionDetails.mockRejectedValue(
        new errors.SessionNotFound('expired'),
      );

      const res = await call('POST', '/deny');

      expect(res.status).toBe(400);
      expect(((await res.json()) as { errorCode: string }).errorCode).toBe(
        'invalid_interaction',
      );
    });
  });
});
