import { Injectable } from '@nestjs/common';
import { defer, switchMap } from 'rxjs';
import { DataSource } from 'typeorm';

import { ImageProcessorService } from '@hdotu1/image-processor-client';

import type { CreatePostDto } from './dto/create-post.dto.js';
import { PhotoEntity } from './entities/photo.entity.js';
import { PostEntity } from './entities/post.entity.js';

@Injectable()
export class PostService {
  constructor(
    private imageProcessor: ImageProcessorService,
    private dataSource: DataSource,
  ) {}

  createUserPost(file: Express.Multer.File, data: CreatePostDto) {
    this.imageProcessor
      .fromConfig({
        path: file.path,
        mimetype: file.mimetype,
      })
      .pipe(
        switchMap((processed) => {
          return defer(() =>
            this.dataSource.transaction(async (manager) => {
              const photoEntities = processed.images.map((image) => {
                return manager.create(PhotoEntity, {
                  file: image.path,
                  mimetype: image.mimetype,
                  width: image.width,
                  height: image.height,
                });
              });

              const postEntity = manager.create(PostEntity, {
                caption: data.caption,
                photos: photoEntities,
                isPublished: false,
              });

              await manager.save(postEntity);
            }),
          );
        }),
      )
      .subscribe({
        next: (processed) => {},
      });
  }
}
