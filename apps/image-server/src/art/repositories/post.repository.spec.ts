import { describe, expect, it, vi } from 'vitest';

import type { PostEntity } from '../entities/post.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';
import { PostRepository } from './post.repository.js';

describe('PostRepository', () => {
  describe('createDraft', () => {
    it('should create a post draft with Draft status', () => {
      const repository = Object.create(
        PostRepository.prototype,
      ) as PostRepository;

      repository.create = vi
        .fn()
        .mockImplementation((entityLike: PostEntity) => entityLike);

      const result = repository.createDraft({
        caption: 'Test caption',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith({
        caption: 'Test caption',
        status: PostStatus.Draft,
      });

      expect(result).toEqual({
        caption: 'Test caption',
        status: PostStatus.Draft,
      });
    });

    it('should override provided status with Draft status', () => {
      const repository = Object.create(
        PostRepository.prototype,
      ) as PostRepository;

      repository.create = vi
        .fn()
        .mockImplementation((entityLike: PostEntity) => entityLike);

      const result = repository.createDraft({
        caption: 'Published caption',
        status: PostStatus.Published,
      } as never);

      expect(result.status).toBe(PostStatus.Draft);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith({
        caption: 'Published caption',
        status: PostStatus.Draft,
      });
    });
  });
});
