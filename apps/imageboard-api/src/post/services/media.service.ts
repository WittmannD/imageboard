import { Injectable } from '@nestjs/common';
import { imageSizeFromFile } from 'image-size/fromFile';
import {
  catchError,
  EMPTY,
  firstValueFrom,
  from,
  map,
  mergeMap,
  type Observable,
  switchMap,
  throwError,
  timeout,
  toArray,
} from 'rxjs';

import { LayoutEngine, type Tile } from '@hdotu1/gallery-layout-engine';
import { ImageProcessorService } from '@hdotu1/image-processor-client';
import { VideoProcessorService } from '@hdotu1/video-processor-client';

import {
  IMAGE_PROCESSING_TIMEOUT,
  VIDEO_PROBE_TIMEOUT,
  VIDEO_PROCESSING_TIMEOUT,
} from '../../config/configuration.js';
import type { FileUpload } from '../../multer/file-upload.js';
import type { MediaEntity, MediaSource } from '../entities/media.entity.js';
import { MediaType, mediaTypeOf } from '../enums/media-type.enum.js';
import {
  GalleryLayoutError,
  ImageProcessingError,
  InvalidImageError,
  InvalidVideoError,
  VideoProcessingError,
} from '../errors/post-service-error.js';
import { MediaRepository } from '../repositories/media.repository.js';

interface Dimensions {
  width: number;
  height: number;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly videoProcessor: VideoProcessorService,
    private readonly mediaRepository: MediaRepository,
    private readonly layoutEngine: LayoutEngine,
  ) {}

  private async readImageSize(file: FileUpload): Promise<Dimensions> {
    try {
      const { width, height } = await imageSizeFromFile(file.path);
      return { width, height };
    } catch (error) {
      throw new InvalidImageError(error);
    }
  }

  // the video processor reads the upload from the shared volume, like the
  // image processor does
  private async probeVideo(file: FileUpload): Promise<Dimensions> {
    try {
      return await firstValueFrom(
        this.videoProcessor
          .probe({ key: file.uuid })
          .pipe(timeout(VIDEO_PROBE_TIMEOUT)),
      );
    } catch (error) {
      throw new InvalidVideoError(error);
    }
  }

  private readDimensions(file: FileUpload): Promise<Dimensions> {
    return mediaTypeOf(file.mimetype) === MediaType.Video
      ? this.probeVideo(file)
      : this.readImageSize(file);
  }

  private async createLayoutFromUploads(files: FileUpload[]) {
    // probing a video is a round trip to the video processor, so in parallel
    const inputs = await Promise.all(
      files.map(async (file) => ({
        key: file.uuid,
        ...(await this.readDimensions(file)),
      })),
    );

    try {
      return this.layoutEngine.evaluate(inputs);
    } catch (error) {
      throw new GalleryLayoutError(error);
    }
  }

  /** Renders the derivatives of one upload, sized for its gallery tile. */
  private processUpload(
    file: FileUpload,
    tile: Tile,
  ): Observable<MediaSource[]> {
    const message = { key: tile.key, variables: { tile } };

    if (mediaTypeOf(file.mimetype) === MediaType.Video) {
      return this.videoProcessor.fromConfig(message).pipe(
        timeout(VIDEO_PROCESSING_TIMEOUT),
        catchError((error: unknown) =>
          throwError(() => new VideoProcessingError(error)),
        ),
        map((processed) => processed.outputs),
      );
    }

    return this.imageProcessor.fromConfig(message).pipe(
      timeout(IMAGE_PROCESSING_TIMEOUT),
      catchError((error: unknown) =>
        throwError(() => new ImageProcessingError(error)),
      ),
      map((processed) => processed.images),
    );
  }

  private processMediaUploads(files: FileUpload[]) {
    return from(this.createLayoutFromUploads(files)).pipe(
      switchMap(({ layout }) =>
        from(layout.tiles).pipe(
          mergeMap((tile) => {
            const file = files.find((f) => f.uuid === tile.key);

            if (!file) {
              return EMPTY;
            }

            return this.processUpload(file, tile).pipe(
              map((sources) => ({ sources, file })),
            );
          }),
        ),
      ),
    );
  }

  /**
   * Processes the uploads into their derivatives and returns the drafts marked
   * Ready, unsaved: encoding a video takes minutes, far too long to hold a
   * database transaction open for, so the caller saves them afterwards.
   */
  createMediaGallery(
    drafts: MediaEntity[],
    files: FileUpload[],
  ): Observable<MediaEntity[]> {
    return this.processMediaUploads(files).pipe(
      mergeMap(({ file, sources }) => {
        const mediaEntity = drafts.find((e) => e.uploadUuid === file.uuid);

        if (!mediaEntity) {
          return EMPTY;
        }

        return from(
          this.mediaRepository.setProcessedAssets(mediaEntity, sources),
        );
      }),
      toArray(),
    );
  }
}
