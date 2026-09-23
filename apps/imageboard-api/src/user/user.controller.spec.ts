import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service.js';
import {
  AccessTokenExpiredError,
  AuthProviderUnavailableError,
  EmailNotVerifiedError,
  OrphanedFederatedCredentialError,
} from '../auth/errors/auth-service-error.js';
import { HttpErrorFilter } from '../common/filters/http-error.filter.js';
import {
  AvatarProcessingError,
  UsernameTakenError,
  UserNotFoundError,
} from './errors/user-service-error.js';
import { AvatarService } from './service/avatar.service.js';
import { UserService } from './service/user.service.js';
import { UserController } from './user.controller.js';

describe('UserController errors', () => {
  let app: INestApplication;
  let base: string;
  const user = { id: 1, username: 'alice', email: 'alice@example.com' };
  const userService = {
    getOneById: vi.fn(),
    updateUsername: vi.fn(),
  };
  const avatarService = { setAvatar: vi.fn() };
  const authService = { validateAccessToken: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.validateAccessToken.mockResolvedValue(user);
    userService.getOneById.mockResolvedValue(user);

    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AvatarService, useValue: avatarService },
        { provide: AuthService, useValue: authService },
        { provide: APP_PIPE, useClass: ValidationPipe },
        { provide: APP_FILTER, useClass: HttpErrorFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    base = await app.getUrl();
  });

  afterEach(async () => {
    await app.close();
  });

  const request = (
    path: string,
    init: RequestInit & { auth?: boolean } = {},
  ) => {
    const { auth = true, ...rest } = init;
    const headers = new Headers(rest.headers);
    headers.set('content-type', 'application/json');
    if (auth) headers.set('authorization', 'Bearer token');

    return fetch(`${base}/user${path}`, { ...rest, headers });
  };

  const body = async (res: Response) =>
    (await res.json()) as { statusCode: number; errorCode?: string; message?: string };

  it('maps UserNotFoundError to 404 user_not_found', async () => {
    userService.getOneById.mockRejectedValue(new UserNotFoundError());

    const res = await request('/42', { auth: false });

    expect(res.status).toBe(404);
    expect(await body(res)).toMatchObject({
      statusCode: 404,
      errorCode: 'user_not_found',
      message: 'User not found',
    });
  });

  it('maps UsernameTakenError to 409 username_taken', async () => {
    userService.updateUsername.mockRejectedValue(new UsernameTakenError());

    const res = await request('/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'bob' }),
    });

    expect(res.status).toBe(409);
    expect((await body(res)).errorCode).toBe('username_taken');
  });

  it('maps AvatarProcessingError to 502 image_processing_failed', async () => {
    avatarService.setAvatar.mockRejectedValue(new AvatarProcessingError());
    const form = new FormData();
    form.append('avatar', new Blob([PNG_1x1], { type: 'image/png' }), 'a.png');

    const res = await fetch(`${base}/user/me/avatar`, {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: form,
    });

    expect(res.status).toBe(502);
    expect((await body(res)).errorCode).toBe('image_processing_failed');
  });

  it('rejects a missing avatar file with file_required', async () => {
    const res = await fetch(`${base}/user/me/avatar`, {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: new FormData(),
    });

    expect(res.status).toBe(400);
    expect((await body(res)).errorCode).toBe('file_required');
  });

  it('codes ValidationPipe errors as invalid_input', async () => {
    const res = await request('/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'x' }),
    });

    expect(res.status).toBe(400);
    expect((await body(res)).errorCode).toBe('invalid_input');
  });

  it('masks unexpected errors as 500 internal_error', async () => {
    userService.getOneById.mockRejectedValue(new Error('db password is hunter2'));

    const res = await request('/42', { auth: false });
    const json = await body(res);

    expect(res.status).toBe(500);
    expect(json).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      errorCode: 'internal_error',
    });
  });

  describe('AuthGuard', () => {
    it('rejects a missing header with access_token_missing', async () => {
      const res = await request('/me', { auth: false });

      expect(res.status).toBe(401);
      expect((await body(res)).errorCode).toBe('access_token_missing');
    });

    it('rejects a non-Bearer header with access_token_invalid', async () => {
      const res = await request('/me', {
        auth: false,
        headers: { authorization: 'Basic abc' },
      });

      expect(res.status).toBe(401);
      expect((await body(res)).errorCode).toBe('access_token_invalid');
    });

    it.each([
      [new AccessTokenExpiredError(), 401, 'access_token_expired'],
      [new EmailNotVerifiedError(), 401, 'email_not_verified'],
      [new AuthProviderUnavailableError(), 503, 'service_unavailable'],
    ])('maps %s', async (error, status, errorCode) => {
      authService.validateAccessToken.mockRejectedValue(error);

      const res = await request('/me');

      expect(res.status).toBe(status);
      expect((await body(res)).errorCode).toBe(errorCode);
    });

    it('answers an unmapped service error with an opaque 500', async () => {
      authService.validateAccessToken.mockRejectedValue(
        new OrphanedFederatedCredentialError(),
      );

      const res = await request('/me');

      expect(res.status).toBe(500);
      expect(await body(res)).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        errorCode: 'internal_error',
      });
    });

    it('does not disguise unexpected failures as 401', async () => {
      authService.validateAccessToken.mockRejectedValue(new Error('db down'));

      const res = await request('/me');

      expect(res.status).toBe(500);
      expect((await body(res)).errorCode).toBe('internal_error');
    });
  });
});

// smallest valid PNG, so the file-type validator's magic-number check passes
const PNG_1x1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);
