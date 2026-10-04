import { Injectable } from '@nestjs/common';
import { imageSizeFromFile } from 'image-size/fromFile';
import {
  catchError,
  defer,
  EMPTY,
  from,
  map,
  mergeMap,
  switchMap,
  throwError,
  timeout,
} from 'rxjs';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';
import { LayoutEngine } from '@hdotu1/gallery-layout-engine';
import { ImageProcessorService } from '@hdotu1/image-processor-client';

import { IMAGE_PROCESSING_TIMEOUT } from '../../config/configuration.js';
import type { FileUpload } from '../../multer/file-upload.js';
import type { PhotoEntity } from '../entities/photo.entity.js';
import {
  GalleryLayoutError,
  ImageProcessingError,
  InvalidImageError,
} from '../errors/post-service-error.js';
import { PhotoRepository } from '../repositories/photo.repository.js';

@Injectable()
export class PhotoService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly photoRepository: PhotoRepository,
    private readonly layoutEngine: LayoutEngine,
    private readonly tx: TransactionService,
  ) {}

  private async readImageSize(file: FileUpload) {
    try {
      return await imageSizeFromFile(file.path);
    } catch (error) {
      throw new InvalidImageError(error);
    }
  }

  private async createLayoutFromUploads(files: FileUpload[]) {
    const images = [];

    for (const file of files) {
      const metadata = await this.readImageSize(file);
      images.push({
        metadata,
        file,
      });
    }

    try {
      return this.layoutEngine.evaluate(
        images.map((image) => ({
          key: image.file.uuid,
          width: image.metadata.width,
          height: image.metadata.height,
        })),
      );
    } catch (error) {
      throw new GalleryLayoutError(error);
    }
  }

  private processPhotoUploads(files: FileUpload[]) {
    return from(this.createLayoutFromUploads(files)).pipe(
      switchMap(({ layout }) =>
        from(layout.tiles).pipe(
          mergeMap((tile) => {
            const file = files.find((f) => f.uuid === tile.key);

            if (!file) {
              return EMPTY;
            }

            return this.imageProcessor
              .fromConfig({
                key: tile.key,
                variables: { tile },
              })
              .pipe(
                timeout(IMAGE_PROCESSING_TIMEOUT),
                catchError((error: unknown) =>
                  throwError(() => new ImageProcessingError(error)),
                ),
                map((processed) => ({
                  processed,
                  file,
                })),
              );
          }),
        ),
      ),
    );
  }

  createPhotoGallery(
    drafts: PhotoEntity[],
    files: FileUpload[],
    em?: EntityManager,
  ) {
    return this.tx.withManager$(em, (entityManager) => {
      const photoRepository = entityManager.withRepository(
        this.photoRepository,
      );

      return this.processPhotoUploads(files).pipe(
        mergeMap(({ file, processed }) => {
          const photoEntity = drafts.find((e) => e.uploadUuid === file.uuid);

          if (!photoEntity) {
            return EMPTY;
          }

          return defer(async () => {
            const readyPhotoEntity =
              await this.photoRepository.setProcessedAssets(
                photoEntity,
                processed.images,
              );

            return await photoRepository.save(readyPhotoEntity);
          });
        }),
      );
    });
  }
}
