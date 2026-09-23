import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service.js';
import { InvalidCursorError } from '../common/errors/common-errors.js';
import { HttpErrorFilter } from '../common/filters/http-error.filter.js';
import { encodeBase64Json } from '../common/utils/base64-json.js';
import { PostController } from './post.controller.js';
import { PostService } from './post.service.js';

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
