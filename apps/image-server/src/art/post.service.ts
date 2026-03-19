import { Injectable } from '@nestjs/common';
import { defer, EMPTY, from, mergeMap, switchMap } from 'rxjs';
import { DataSource, In } from 'typeorm';

import { ImageProcessorService } from '@hdotu1/image-processor-client';

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

@Injectable()
export class PostService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly dataSource: DataSource,
    private readonly postRepository: PostRepository,
    private readonly photoRepository: PhotoRepository,
  ) {}

  async createUserPost(files: FileUpload[], dto: CreatePostDto) {
    return await this.dataSource.transaction(
      async (entityManager): Promise<PostEntity> => {
        const postRepository = entityManager.withRepository(
          this.postRepository,
        );
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

        await entityManager.save([postEntity, ...photoEntities]);

        from(photoEntities)
          .pipe(
            mergeMap((photoEntity) => {
              const file = files.find((f) => f.uuid === photoEntity.uploadUuid);

              if (!file) {
                return EMPTY;
              }

              return this.imageProcessor.fromConfig({ path: file.path }).pipe(
                switchMap((processed) => {
                  return defer(async () => {
                    postEntity.status = PostStatus.Published;
                    const readyPhotoEntity =
                      await this.photoRepository.setProcessedAssets(
                        photoEntity,
                        processed.images,
                      );
                    await this.postRepository.save(postEntity);
                    await this.photoRepository.save(readyPhotoEntity);
                  });
                }),
              );
            }),
          )
          .subscribe();

        return postEntity;
      },
    );
  }

  async list(
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
