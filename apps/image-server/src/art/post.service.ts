import { Injectable } from '@nestjs/common';
import { defer, switchMap } from 'rxjs';
import { EntityManager, In } from 'typeorm';

import type { TransactionService } from '../common/services/transaction.service.js';
import type { KeySetCursor } from '../common/types/cursor.js';
import { paginate, type PaginateOptions } from '../common/utils/paginate.js';
import type { FileUpload } from '../multer/file-upload.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { PostEntity } from './entities/post.entity.js';
import { PostStatus } from './enums/post-status.enum.js';
import { PhotoRepository } from './repositories/photo.repository.js';
import {
  type PostPage,
  PostRepository,
} from './repositories/post.repository.js';
import type { PhotoService } from './services/photo.service.js';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly photoRepository: PhotoRepository,
    private readonly photoService: PhotoService,
    private readonly tx: TransactionService,
  ) {}

  async createPost(
    files: FileUpload[],
    dto: CreatePostDto,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const postRepository = entityManager.withRepository(this.postRepository);
      const photoRepository = entityManager.withRepository(
        this.photoRepository,
      );

      const postEntity = postRepository.createDraft({
        caption: dto.caption,
      });
      const photoEntities = photoRepository.createDraftsForPost(
        postEntity,
        files,
      );

      await this.photoService.createPhotoGallery(
        photoEntities,
        files,
        entityManager,
      );

      await entityManager.save([postEntity, ...photoEntities]);

      (await this.photoService.createPhotoGallery(photoEntities, files)).pipe(
        switchMap((photoEntity) =>
          defer(async () => {
            postEntity.photos.push(photoEntity);
            postEntity.status = PostStatus.Published;
            await postRepository.save(postEntity);
          }),
        ),
      ).subscribe();

      return postEntity;
    });
  }

  async getPaginatedPosts(
    cursor?: KeySetCursor<PostEntity>,
    options: PaginateOptions = {},
  ): Promise<PostPage> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PostStatus.Published });
    const page = await paginate(query, cursor, options);

    if (page.ids.length === 0) {
      return {
        items: [],
        nextCursor: null,
        hasNextPage: false,
      };
    }

    const posts = await this.postRepository.find({
      where: { id: In(page.ids) },
      relations: { photos: true },
    });

    // preserve the same order as ids
    const byId = new Map<number, PostEntity>(posts.map((p) => [p.id, p]));
    const items = page.ids
      .map((id) => byId.get(id))
      .filter(Boolean) as PostEntity[];

    return {
      items,
      nextCursor: page.nextCursor,
      hasNextPage: page.hasNextPage,
    };
  }
}
