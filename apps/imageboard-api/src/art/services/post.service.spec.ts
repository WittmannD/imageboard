import { Test } from '@nestjs/testing';
import { Observable, throwError } from 'rxjs';
import { In } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionService } from '@hdotu1/database-common';

import type { FileUpload } from '../../multer/file-upload.js';
import type { UserEntity } from '../../user/entities/user.entity.js';
import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';
import { GalleryLayoutError } from '../errors/post-service-error.js';
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
