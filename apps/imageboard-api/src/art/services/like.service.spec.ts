import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionService } from '@hdotu1/database-common';

import { UserEntity } from '../../user/entities/user.entity.js';
import { PostEntity } from '../entities/post.entity.js';
import { PostNotFoundError } from '../errors/post-service-error.js';
import { LikeRepository } from '../repositories/like.repository.js';
import { PostRepository } from '../repositories/post.repository.js';
import { LikeService } from './like.service.js';

const { adjustCounter } = vi.hoisted(() => ({ adjustCounter: vi.fn() }));
vi.mock('../../common/utils/counter.js', () => ({ adjustCounter }));

describe('LikeService', () => {
  let service: LikeService;
  const user = { id: 1 } as UserEntity;
  const post = { id: 7, likesCount: 3, user: { id: 2 } };
  const entityManager = { withRepository: <T>(repository: T) => repository };
  const postRepository = { findOne: vi.fn(), findOneOrFail: vi.fn() };
  const likeRepository = {
    insertIfAbsent: vi.fn(),
    deleteByUserAndPost: vi.fn(),
  };
  const tx = {
    withManager: (_: unknown, cb: (m: unknown) => unknown) => cb(entityManager),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    postRepository.findOne.mockResolvedValue(post);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LikeService,
        { provide: PostRepository, useValue: postRepository },
        { provide: LikeRepository, useValue: likeRepository },
        { provide: TransactionService, useValue: tx },
      ],
    }).compile();

    service = moduleRef.get(LikeService);
  });

  it('increments the post and author counters when the like is inserted', async () => {
    likeRepository.insertIfAbsent.mockResolvedValue(true);
    postRepository.findOneOrFail.mockResolvedValue({ id: 7, likesCount: 4 });

    await expect(service.likePost(user, 7)).resolves.toEqual({
      postId: 7,
      likesCount: 4,
      likedByMe: true,
    });

    expect(likeRepository.insertIfAbsent).toHaveBeenCalledWith(1, 7);
    expect(adjustCounter).toHaveBeenCalledWith(
      entityManager,
      PostEntity,
      7,
      'likesCount',
      1,
    );
    expect(adjustCounter).toHaveBeenCalledWith(
      entityManager,
      UserEntity,
      2,
      'likesReceivedCount',
      1,
    );
  });

  it('leaves the counters alone when the post is already liked', async () => {
    likeRepository.insertIfAbsent.mockResolvedValue(false);

    await expect(service.likePost(user, 7)).resolves.toEqual({
      postId: 7,
      likesCount: 3,
      likedByMe: true,
    });

    expect(adjustCounter).not.toHaveBeenCalled();
  });

  it('decrements both counters when a like is removed', async () => {
    likeRepository.deleteByUserAndPost.mockResolvedValue(true);
    postRepository.findOneOrFail.mockResolvedValue({ id: 7, likesCount: 2 });

    await expect(service.unlikePost(user, 7)).resolves.toEqual({
      postId: 7,
      likesCount: 2,
      likedByMe: false,
    });

    expect(adjustCounter).toHaveBeenCalledWith(
      entityManager,
      PostEntity,
      7,
      'likesCount',
      -1,
    );
    expect(adjustCounter).toHaveBeenCalledWith(
      entityManager,
      UserEntity,
      2,
      'likesReceivedCount',
      -1,
    );
  });

  it('leaves the counters alone when there was no like to remove', async () => {
    likeRepository.deleteByUserAndPost.mockResolvedValue(false);

    await service.unlikePost(user, 7);

    expect(adjustCounter).not.toHaveBeenCalled();
  });

  it('throws PostNotFoundError for a missing or unpublished post', async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(service.likePost(user, 7)).rejects.toBeInstanceOf(
      PostNotFoundError,
    );
    expect(likeRepository.insertIfAbsent).not.toHaveBeenCalled();
  });
});
