import { Test } from '@nestjs/testing';
import { Observable, throwError } from 'rxjs';
import { In } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionService } from '@hdotu1/database-common';

import type { FileUpload } from '../../multer/file-upload.js';
import type { UserEntity } from '../../user/entities/user.entity.js';
import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';
import { PostStatus } from '../enums/post-status.enum.js';
import {
  GalleryLayoutError,
  PostAccessForbiddenError,
} from '../errors/post-service-error.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import { PostRepository } from '../repositories/post.repository.js';
import { LikeService } from './like.service.js';
import { PostService } from './post.service.js';
import { PhotoService } from './photo.service.js';

describe('PostService.createUserPost gallery failures', () => {
  let service: PostService;
  const photos = [{ id: 11 }, { id: 12 }];
  const entityManager = {
    withRepository: <T>(repository: T) => repository,
    save: vi.fn(),
  };
  const postRepository = { createDraft: vi.fn(), save: vi.fn() };
  const photoRepository = { createDraftsForPost: vi.fn(), update: vi.fn() };
  const photoService = { createPhotoGallery: vi.fn() };
  const tx = {
    withManager: (_: unknown, cb: (m: unknown) => unknown) => cb(entityManager),
    withManager$: (_: unknown, cb: (m: unknown) => Observable<unknown>) =>
      cb(entityManager),
  };
  let uncaught: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    postRepository.createDraft.mockReturnValue({ id: 1 });
    photoRepository.createDraftsForPost.mockReturnValue(photos);
    entityManager.save.mockImplementation((entity: unknown) =>
      Promise.resolve(entity),
    );
    photoRepository.update.mockResolvedValue(undefined);

    // an error escaping the subscription would surface here and crash the process
    uncaught = vi.fn();
    process.on('uncaughtException', uncaught);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepository, useValue: postRepository },
        { provide: PhotoRepository, useValue: photoRepository },
        { provide: PhotoService, useValue: photoService },
        { provide: LikeService, useValue: {} },
        { provide: TransactionService, useValue: tx },
      ],
    }).compile();
    moduleRef.useLogger(false);

    service = moduleRef.get(PostService);
  });

  afterEach(() => {
    process.off('uncaughtException', uncaught);
  });

  const createPost = () =>
    service.createUserPost({ id: 1 } as UserEntity, [] as FileUpload[], {
      caption: 'hi',
    });

  const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

  it('marks the photos Failed instead of crashing when the gallery fails', async () => {
    photoService.createPhotoGallery.mockReturnValue(
      throwError(() => new GalleryLayoutError()),
    );

    await expect(createPost()).resolves.toMatchObject({ id: 1, photos });
    await settle();

    expect(photoRepository.update).toHaveBeenCalledWith(
      { id: In([11, 12]) },
      { status: PhotoProcessingStatus.Failed },
    );
    expect(uncaught).not.toHaveBeenCalled();
  });

  it('swallows a failure to mark the photos Failed', async () => {
    photoService.createPhotoGallery.mockReturnValue(
      throwError(() => new GalleryLayoutError()),
    );
    photoRepository.update.mockRejectedValue(new Error('db down'));

    await createPost();
    await settle();

    expect(photoRepository.update).toHaveBeenCalled();
    expect(uncaught).not.toHaveBeenCalled();
  });
});

describe('PostService.getPaginatedPostsByAuthor access', () => {
  let service: PostService;
  const author = { id: 42 } as UserEntity;
  const query = {
    alias: 'post',
    where: vi.fn(),
    andWhere: vi.fn(),
    addSelect: vi.fn(),
    orderBy: vi.fn(),
    take: vi.fn(),
    getMany: vi.fn(),
  };
  const postRepository = { createQueryBuilder: vi.fn() };
  const tx = {
    withManager: (_: unknown, cb: (m: unknown) => unknown) =>
      cb({ withRepository: <T>(repository: T) => repository }),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    for (const method of ['where', 'andWhere', 'addSelect', 'orderBy', 'take']) {
      query[method as 'where'].mockReturnValue(query);
    }
    query.getMany.mockResolvedValue([]);
    postRepository.createQueryBuilder.mockReturnValue(query);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PostRepository, useValue: postRepository },
        { provide: PhotoRepository, useValue: {} },
        { provide: PhotoService, useValue: {} },
        { provide: LikeService, useValue: {} },
        { provide: TransactionService, useValue: tx },
      ],
    }).compile();

    service = moduleRef.get(PostService);
  });

  it.each([PostStatus.Draft, PostStatus.Unpublished])(
    'forbids %s posts to an anonymous viewer',
    async (status) => {
      await expect(
        service.getPaginatedPostsByAuthor(author.id, status),
      ).rejects.toBeInstanceOf(PostAccessForbiddenError);
      expect(postRepository.createQueryBuilder).not.toHaveBeenCalled();
    },
  );

  it('forbids unpublished posts to a viewer who is not the author', async () => {
    await expect(
      service.getPaginatedPostsByAuthor(
        author.id,
        PostStatus.Unpublished,
        undefined,
        {},
        { id: 7 } as UserEntity,
      ),
    ).rejects.toBeInstanceOf(PostAccessForbiddenError);
  });

  it('lets the author list their own unpublished posts', async () => {
    const page = await service.getPaginatedPostsByAuthor(
      author.id,
      PostStatus.Unpublished,
      undefined,
      {},
      author,
    );

    expect(page).toEqual({ items: [], nextCursor: null, hasNextPage: false });
    expect(query.where).toHaveBeenCalledWith('post.status = :status', {
      status: PostStatus.Unpublished,
    });
    expect(query.andWhere).toHaveBeenCalledWith('post.user = :authorId', {
      authorId: author.id,
    });
  });

  it('lets anyone list published posts', async () => {
    await expect(
      service.getPaginatedPostsByAuthor(author.id, PostStatus.Published),
    ).resolves.toMatchObject({ items: [] });
  });
});
