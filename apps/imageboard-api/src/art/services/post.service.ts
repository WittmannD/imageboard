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
import { PhotoRepository } from '../repositories/photo.repository.js';
import {
  type PostPage,
  PostRepository,
} from '../repositories/post.repository.js';
import { LikeService } from './like.service.js';
import { PhotoService } from './photo.service.js';

// cursor fields a client may paginate posts by
const POST_SORTABLE_FIELDS = ['createdAt'] as const;

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

              post.status = PostStatus.Published;
              await postRepository.save(post);
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

  /** `viewer` is the requesting user, used to fill `likedByMe`. */
  async getPaginatedPublishedPostsWithUser(
    cursor?: KeySetCursor<PostEntity>,
    options: PaginateOptions = {},
    viewer?: UserEntity,
    em?: EntityManager,
  ): Promise<PostPage> {
    return await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);
      const query = postRepository
        .createQueryBuilder('post')
        .where('post.status = :status', { status: PostStatus.Published });

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
        ? await this.likeService.getLikedPostIds(viewer, page.ids, entityManager)
        : new Set<number>();
      const items = page.ids
        .map((id) => byId.get(id))
        .filter((post): post is PostEntity => post !== undefined)
        .map((post) => Object.assign(post, { likedByMe: likedIds.has(post.id) }));

      return {
        items,
        nextCursor: page.nextCursor,
        hasNextPage: page.hasNextPage,
      };
    });
  }
}
