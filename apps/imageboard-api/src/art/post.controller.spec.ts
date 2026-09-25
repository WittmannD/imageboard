import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service.js';
import { InvalidCursorError } from '../common/errors/common-errors.js';
import { HttpErrorFilter } from '../common/filters/http-error.filter.js';
import { encodeBase64Json } from '../common/utils/base64-json.js';
import { PostNotFoundError } from './errors/post-service-error.js';
import { PostController } from './post.controller.js';
import { LikeService } from './services/like.service.js';
import { PostService } from './services/post.service.js';

describe('PostController pagination', () => {
  let app: INestApplication;
  let base: string;
  const postService = { getPaginatedPublishedPostsWithUser: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    postService.getPaginatedPublishedPostsWithUser.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNextPage: false,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: postService },
        { provide: LikeService, useValue: {} },
        { provide: AuthService, useValue: {} },
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

  const getPosts = (query: string) => fetch(`${base}/posts?${query}`);

  it('decodes the cursor and converts the limit before calling the service', async () => {
    const cursor = { id: 10, createdAt: '2026-01-01T00:00:00.000Z' };

    const res = await getPosts(
      `cursor=${encodeBase64Json(cursor)}&limit=5&order=asc`,
    );

    expect(res.status).toBe(200);
    expect(postService.getPaginatedPublishedPostsWithUser).toHaveBeenCalledWith(
      cursor,
      { limit: 5, order: 'ASC' },
      undefined,
    );
  });

  it('rejects a cursor that is not base64 JSON with invalid_cursor', async () => {
    const res = await getPosts('cursor=%%%not-base64');

    expect(res.status).toBe(400);
    expect(((await res.json()) as { errorCode: string }).errorCode).toBe(
      'invalid_cursor',
    );
  });

  it('maps InvalidCursorError from the service to 400 invalid_cursor', async () => {
    postService.getPaginatedPublishedPostsWithUser.mockRejectedValue(
      new InvalidCursorError('Cannot paginate by "caption"'),
    );

    const res = await getPosts(
      `cursor=${encodeBase64Json({ id: 1, caption: 'x' })}`,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      errorCode: 'invalid_cursor',
      message: 'Cannot paginate by "caption"',
    });
  });

  it('codes an out-of-range limit as invalid_input', async () => {
    const res = await getPosts('limit=1000');

    expect(res.status).toBe(400);
    expect(((await res.json()) as { errorCode: string }).errorCode).toBe(
      'invalid_input',
    );
  });
});

describe('PostController likes', () => {
  let app: INestApplication;
  let base: string;
  const user = { id: 1, username: 'alice' };
  const postService = { getPaginatedPublishedPostsWithUser: vi.fn() };
  const likeService = { likePost: vi.fn(), unlikePost: vi.fn() };
  const authService = { validateAccessToken: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.validateAccessToken.mockResolvedValue(user);
    postService.getPaginatedPublishedPostsWithUser.mockResolvedValue({
      items: [{ id: 7, likesCount: 3, likedByMe: true, photos: [], user }],
      nextCursor: null,
      hasNextPage: false,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: postService },
        { provide: LikeService, useValue: likeService },
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
    if (auth) headers.set('authorization', 'Bearer token');

    return fetch(`${base}/posts${path}`, { ...rest, headers });
  };

  it('serves the feed anonymously without a viewer', async () => {
    const res = await request('', { auth: false });

    expect(res.status).toBe(200);
    expect(authService.validateAccessToken).not.toHaveBeenCalled();
    expect(postService.getPaginatedPublishedPostsWithUser).toHaveBeenCalledWith(
      undefined,
      expect.anything(),
      undefined,
    );
  });

  it('passes the signed-in viewer to the feed, skipping email verification', async () => {
    const res = await request('');

    expect(res.status).toBe(200);
    expect(authService.validateAccessToken).toHaveBeenCalledWith('token', true);
    expect(postService.getPaginatedPublishedPostsWithUser).toHaveBeenCalledWith(
      undefined,
      expect.anything(),
      user,
    );
    expect(await res.json()).toMatchObject({
      items: [{ id: 7, likesCount: 3, likedByMe: true }],
    });
  });

  it('rejects a malformed token on the feed instead of going anonymous', async () => {
    const res = await request('', {
      auth: false,
      headers: { authorization: 'Basic abc' },
    });

    expect(res.status).toBe(401);
  });

  it('likes a post for the signed-in user', async () => {
    likeService.likePost.mockResolvedValue({
      postId: 7,
      likesCount: 4,
      likedByMe: true,
    });

    const res = await request('/7/like', { method: 'PUT' });

    expect(res.status).toBe(200);
    expect(likeService.likePost).toHaveBeenCalledWith(user, 7);
    expect(await res.json()).toEqual({
      postId: 7,
      likesCount: 4,
      likedByMe: true,
    });
  });

  it('unlikes a post for the signed-in user', async () => {
    likeService.unlikePost.mockResolvedValue({
      postId: 7,
      likesCount: 2,
      likedByMe: false,
    });

    const res = await request('/7/like', { method: 'DELETE' });

    expect(res.status).toBe(200);
    expect(likeService.unlikePost).toHaveBeenCalledWith(user, 7);
  });

  it('requires authentication to like', async () => {
    const res = await request('/7/like', { method: 'PUT', auth: false });

    expect(res.status).toBe(401);
    expect(likeService.likePost).not.toHaveBeenCalled();
  });

  it('maps PostNotFoundError to 404 post_not_found', async () => {
    likeService.likePost.mockRejectedValue(new PostNotFoundError());

    const res = await request('/7/like', { method: 'PUT' });

    expect(res.status).toBe(404);
    expect(((await res.json()) as { errorCode: string }).errorCode).toBe(
      'post_not_found',
    );
  });

  it('rejects a non-integer post id', async () => {
    const res = await request('/abc/like', { method: 'PUT' });

    expect(res.status).toBe(400);
    expect(likeService.likePost).not.toHaveBeenCalled();
  });
});
