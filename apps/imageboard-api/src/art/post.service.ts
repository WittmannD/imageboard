import { Injectable } from '@nestjs/common';
import { defer, switchMap } from 'rxjs';
import { EntityManager, In } from 'typeorm';

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
import { PhotoService } from './services/photo.service.js';
import * as util from 'node:util';
import { TransactionService } from '@hdotu1/database-common';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly photoRepository: PhotoRepository,
    private readonly photoService: PhotoService,
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

  async createPost(
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
      });

      postEntity = await entityManager.save(postEntity);

      let photoEntities = photoRepository.createDraftsForPost(
        postEntity,
        files,
      );

      photoEntities = await entityManager.save(photoEntities);
      postEntity.photos = photoEntities;

      console.log(
        'createPost photoEntities',
        util.inspect(photoEntities, { depth: 5 }),
      );

      return postEntity;
    });

    console.log('createPost files', util.inspect(files, { depth: 5 }));
    console.log('createPost post', util.inspect(postEntity, { depth: 5 }));

    // we don't need to pass entity manager here, let it run in its own transaction
    this.createPhotoGalleryForPost(postEntity, files).subscribe();

    return postEntity;
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
