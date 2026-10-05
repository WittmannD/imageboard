import { Injectable, Logger } from '@nestjs/common';
import { catchError, defer, switchMap } from 'rxjs';
import { EntityManager, In } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type { KeySetCursor } from '../../common/types/cursor.js';
import { paginate, type PaginateOptions } from '../../common/utils/paginate.js';
import type { FileUpload } from '../../multer/file-upload.js';
import type { UserEntity } from '../../user/entities/user.entity.js';
import type { CreatePostDto } from '../dto/create-post.dto.js';
import type { PostEntity } from '../entities/post.entity.js';
import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';
import { PostStatus } from '../enums/post-status.enum.js';
import {
  InvalidPostStatusTransitionError,
  PostAccessForbiddenError,
  PostNotFoundError,
} from '../errors/post-service-error.js';
import { PhotoRepository } from '../repositories/photo.repository.js';
import {
  type PostPage,
  PostRepository,
} from '../repositories/post.repository.js';
import { LikeService } from './like.service.js';
import { PhotoService } from './photo.service.js';

// cursor fields a client may paginate posts by
const POST_SORTABLE_FIELDS = ['createdAt'] as const;

// status changes an author may make; Unpublished means deleted, and
// Draft -> Published belongs to the gallery pipeline
const AUTHOR_STATUS_TRANSITIONS: Record<PostStatus, readonly PostStatus[]> = {
  [PostStatus.Draft]: [PostStatus.Unpublished],
  [PostStatus.Published]: [PostStatus.Unpublished],
  [PostStatus.Unpublished]: [PostStatus.Published],
};

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly postRepository: PostRepository,
    private readonly photoRepository: PhotoRepository,
    private readonly photoService: PhotoService,
    private readonly likeService: LikeService,
    private readonly tx: TransactionService,
  ) {}

  private createPhotoGalleryForPost(
    post: PostEntity,
    files: FileUpload[],
    em?: EntityManager,
  ) {
    const photoEntities = post.photos;

    return this.tx.withManager$(em, (entityManager) =>
      this.photoService
        .createPhotoGallery(photoEntities, files, entityManager)
        .pipe(
          switchMap(() =>
            defer(async () => {
              const postRepository = entityManager.withRepository(
                this.postRepository,
              );

              // only a post still in Draft: the author may have discarded
              // the draft, setting Unpublished, while the gallery was processing
              await postRepository.update(
                { id: post.id, status: PostStatus.Draft },
                { status: PostStatus.Published },
              );
            }),
          ),
        ),
    );
  }

  async createUserPost(
    user: UserEntity,
    files: FileUpload[],
    dto: CreatePostDto,
    em?: EntityManager,
  ) {
    const postEntity = await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);
      const photoRepository = entityManager.withRepository(
        this.photoRepository,
      );

      let postEntity = postRepository.createDraft({
        caption: dto.caption,
        user,
      });

      postEntity = await entityManager.save(postEntity);

      let photoEntities = photoRepository.createDraftsForPost(
        postEntity,
        files,
      );

      photoEntities = await entityManager.save(photoEntities);
      postEntity.photos = photoEntities;

      return postEntity;
    });

    // We don't need to pass entity manager here, let it run in its own transaction.
    // Nothing awaits it, so it must never error: an unhandled error in a
    // subscription is rethrown asynchronously and crashes the process
    this.createPhotoGalleryForPost(postEntity, files)
      .pipe(
        catchError((error: unknown) => {
          this.logger.error(
            `Failed to create photo gallery for post ${postEntity.id}`,
            error instanceof Error ? error.stack : String(error),
          );

          return defer(() => this.markPhotosFailed(postEntity));
        }),
      )
      .subscribe({
        error: (error: unknown) => {
          this.logger.error(
            `Unhandled error in photo gallery pipeline for post ${postEntity.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        },
      });

    return postEntity;
  }

  // The gallery transaction rolled back, leaving the post a Draft and its
  // photos Processing; flag them so they don't look stuck forever
  private async markPhotosFailed(post: PostEntity) {
    try {
      await this.photoRepository.update(
        { id: In(post.photos.map((photo) => photo.id)) },
        { status: PhotoProcessingStatus.Failed },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark photos of post ${post.id} as failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Moves the author's own post to `status`. Unpublished is how a post is
   * deleted; restoring it to Published needs all its photos Ready.
   */
  async changePostStatus(
    user: UserEntity,
    postId: PostEntity['id'],
    status: PostStatus,
    em?: EntityManager,
  ): Promise<PostEntity> {
    return await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);

      const post = await postRepository.findOne({
        relations: { user: true, photos: true },
        where: { id: postId },
      });

      if (!post) {
        throw new PostNotFoundError();
      }

      if (post.user.id !== user.id) {
        throw new PostAccessForbiddenError(
          'Only the author can change the status of a post',
        );
      }

      const from = post.status;

      if (!AUTHOR_STATUS_TRANSITIONS[from].includes(status)) {
        throw new InvalidPostStatusTransitionError(from, status);
      }

      if (
        status === PostStatus.Published &&
        post.photos.some(
          (photo) => photo.status !== PhotoProcessingStatus.Ready,
        )
      ) {
        throw new InvalidPostStatusTransitionError(
          from,
          status,
          'Cannot publish a post whose photos are not all processed',
        );
      }

      // conditional on the status read above, so a concurrent change (e.g.
      // the gallery pipeline publishing a draft) can't be overwritten
      const { affected } = await postRepository.update(
        { id: post.id, status: from },
        { status },
      );

      if (!affected) {
        throw new InvalidPostStatusTransitionError(
          from,
          status,
          'The post status changed concurrently',
        );
      }

      post.status = status;

      return post;
    });
  }

  /** `viewer` is the requesting user, used to fill `likedByMe`. */
  async getPaginatedPublishedPostsWithUser(
    cursor?: KeySetCursor<PostEntity>,
    options: PaginateOptions = {},
    viewer?: UserEntity,
    em?: EntityManager,
  ): Promise<PostPage> {
    return await this.getPaginatedPosts(
      { status: PostStatus.Published },
      cursor,
      options,
      viewer,
      em,
    );
  }

  /**
   * Posts of the user `authorId` in `status`; `viewer` fills `likedByMe`.
   * Only the author may list posts that aren't Published.
   */
  async getPaginatedPostsByAuthor(
    authorId: UserEntity['id'],
    status: PostStatus = PostStatus.Published,
    cursor?: KeySetCursor<PostEntity>,
    options: PaginateOptions = {},
    viewer?: UserEntity,
    em?: EntityManager,
  ): Promise<PostPage> {
    if (status !== PostStatus.Published && viewer?.id !== authorId) {
      throw new PostAccessForbiddenError();
    }

    return await this.getPaginatedPosts(
      { status, authorId },
      cursor,
      options,
      viewer,
      em,
    );
  }

  private async getPaginatedPosts(
    filter: { status: PostStatus; authorId?: UserEntity['id'] },
    cursor?: KeySetCursor<PostEntity>,
    options: PaginateOptions = {},
    viewer?: UserEntity,
    em?: EntityManager,
  ): Promise<PostPage> {
    const { status, authorId } = filter;

    return await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);
      const query = postRepository
        .createQueryBuilder('post')
        .where('post.status = :status', { status });

      if (authorId !== undefined) {
        query.andWhere('post.user = :authorId', { authorId });
      }

      const page = await paginate(query, cursor, {
        ...options,
        sortableFields: POST_SORTABLE_FIELDS,
      });

      if (page.ids.length === 0) {
        return {
          items: [],
          nextCursor: null,
          hasNextPage: false,
        };
      }

      const posts = await postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.photos', 'photo')
        .leftJoinAndSelect('post.user', 'user')
        .where('post.id IN (:...ids)', { ids: page.ids })
        .getMany();

      // preserve the same order as ids
      const byId = new Map<number, PostEntity>(posts.map((p) => [p.id, p]));
      const likedIds = viewer
        ? await this.likeService.getLikedPostIds(
            viewer,
            page.ids,
            entityManager,
          )
        : new Set<number>();
      const items = page.ids
        .map((id) => byId.get(id))
        .filter((post): post is PostEntity => post !== undefined)
        .map((post) =>
          Object.assign(post, { likedByMe: likedIds.has(post.id) }),
        );

      return {
        items,
        nextCursor: page.nextCursor,
        hasNextPage: page.hasNextPage,
      };
    });
  }
}
