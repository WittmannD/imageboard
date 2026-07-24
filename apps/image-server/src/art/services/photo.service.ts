import { Injectable } from '@nestjs/common';
import { imageSizeFromFile } from 'image-size/fromFile';
import { defer, EMPTY, forkJoin, from, mergeMap, of, switchMap } from 'rxjs';
import type { EntityManager } from 'typeorm';

import { LayoutEngine } from '@hdotu1/gallery-layout-engine';
import { ImageProcessorService } from '@hdotu1/image-processor-client';

import type { TransactionService } from '../../common/services/transaction.service.js';
import type { FileUpload } from '../../multer/file-upload.js';
import type { PhotoEntity } from '../entities/photo.entity.js';
import type { PhotoRepository } from '../repositories/photo.repository.js';

@Injectable()
export class PhotoService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly photoRepository: PhotoRepository,
    private readonly layoutEngine: LayoutEngine,
    private readonly tx: TransactionService
  ) {}

  private async createLayoutFromUploads(files: FileUpload[]) {
    const images = [];

    for (const file of files) {
      const metadata = await imageSizeFromFile(file.path);
      images.push({
        metadata,
        file,
      });
    }

    return this.layoutEngine.evaluate(
      images.map((image) => ({
        key: image.file.uuid,
        width: image.metadata.width,
        height: image.metadata.height,
      })),
    );
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

            return forkJoin({
              file: of(file),
              processed: this.imageProcessor.fromConfig({
                key: tile.key,
                variables: tile,
              }),
            })
          }),
        ),
      ),
    );
  }

  async createPhotoGallery(drafts: PhotoEntity[], files: FileUpload[], em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const photoRepository = entityManager.withRepository(this.photoRepository);
      
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
    })
  }
}
