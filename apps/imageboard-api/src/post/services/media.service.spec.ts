import { Buffer } from 'node:buffer';
import fsPromises from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Test } from '@nestjs/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LayoutEngine } from '@hdotu1/gallery-layout-engine';
import { ImageProcessorService } from '@hdotu1/image-processor-client';
import { VideoProcessorService } from '@hdotu1/video-processor-client';

import type { FileUpload } from '../../multer/file-upload.js';
import type { MediaEntity, MediaSource } from '../entities/media.entity.js';
import { MediaProcessingStatus } from '../enums/media-status.enum.js';
import {
  InvalidVideoError,
  VideoProcessingError,
} from '../errors/post-service-error.js';
import { MediaRepository } from '../repositories/media.repository.js';
import { MediaService } from './media.service.js';

// image-size reads the dimensions from the IHDR chunk, nothing past it
function pngHeader(width: number, height: number) {
  const header = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').copy(header);
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return header;
}

describe('MediaService.createMediaGallery', () => {
  let service: MediaService;
  let dir: string;
  let image: FileUpload;
  let video: FileUpload;
  let drafts: MediaEntity[];

  const tileOf = (key: string) => ({
    key,
    width: 241,
    height: 393,
    fit: 'cover',
    column: 1,
    row: 1,
    columnSpan: 1,
    rowSpan: 1,
  });
  const imageProcessor = { fromConfig: vi.fn() };
  const videoProcessor = { fromConfig: vi.fn(), probe: vi.fn() };
  const layoutEngine = { evaluate: vi.fn() };
  const mediaRepository = {
    setProcessedAssets: (media: MediaEntity, sources: MediaSource[]) =>
      Promise.resolve(
        Object.assign(media, {
          sourceSet: sources,
          status: MediaProcessingStatus.Ready,
        }),
      ),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    dir = await fsPromises.mkdtemp(path.join(tmpdir(), 'media-service-'));

    image = {
      uuid: 'image-uuid',
      mimetype: 'image/png',
      path: path.join(dir, 'image-uuid'),
    } as FileUpload;
    video = {
      uuid: 'video-uuid',
      mimetype: 'video/mp4',
      path: path.join(dir, 'video-uuid'),
    } as FileUpload;
    await fsPromises.writeFile(image.path, pngHeader(300, 200));
    drafts = [image, video].map(
      (file, id) =>
        ({
          id,
          uploadUuid: file.uuid,
          status: MediaProcessingStatus.Processing,
        }) as MediaEntity,
    );

    videoProcessor.probe.mockReturnValue(of({ width: 1080, height: 1920 }));
    layoutEngine.evaluate.mockReturnValue({
      layout: { tiles: [tileOf('image-uuid'), tileOf('video-uuid')] },
    });
    imageProcessor.fromConfig.mockReturnValue(
      of({ images: [{ key: 'image-uuid/tile.jpeg' }] }),
    );
    videoProcessor.fromConfig.mockReturnValue(
      of({ outputs: [{ key: 'video-uuid/tile.mp4' }] }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ImageProcessorService, useValue: imageProcessor },
        { provide: VideoProcessorService, useValue: videoProcessor },
        { provide: LayoutEngine, useValue: layoutEngine },
        { provide: MediaRepository, useValue: mediaRepository },
      ],
    }).compile();

    service = moduleRef.get(MediaService);
  });

  afterEach(async () => {
    await fsPromises.rm(dir, { recursive: true, force: true });
  });

  const createGallery = () =>
    firstValueFrom(service.createMediaGallery(drafts, [image, video]));

  it('lays out images and probed videos together', async () => {
    await createGallery();

    expect(videoProcessor.probe).toHaveBeenCalledWith({ key: 'video-uuid' });
    expect(layoutEngine.evaluate).toHaveBeenCalledWith([
      { key: 'image-uuid', width: 300, height: 200 },
      { key: 'video-uuid', width: 1080, height: 1920 },
    ]);
  });

  it('sends each tile to the processor of its kind', async () => {
    await createGallery();

    expect(imageProcessor.fromConfig).toHaveBeenCalledWith({
      key: 'image-uuid',
      variables: { tile: tileOf('image-uuid') },
    });
    expect(videoProcessor.fromConfig).toHaveBeenCalledWith({
      key: 'video-uuid',
      variables: { tile: tileOf('video-uuid') },
    });
  });

  it('returns every draft Ready with its derivatives', async () => {
    const media = await createGallery();

    expect(media).toHaveLength(2);
    expect(media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uploadUuid: 'image-uuid',
          status: MediaProcessingStatus.Ready,
          sourceSet: [{ key: 'image-uuid/tile.jpeg' }],
        }),
        expect.objectContaining({
          uploadUuid: 'video-uuid',
          status: MediaProcessingStatus.Ready,
          sourceSet: [{ key: 'video-uuid/tile.mp4' }],
        }),
      ]),
    );
  });

  it('fails with InvalidVideoError when a video cannot be probed', async () => {
    videoProcessor.probe.mockReturnValue(
      throwError(() => new Error('video-uuid has no video stream')),
    );

    await expect(createGallery()).rejects.toBeInstanceOf(InvalidVideoError);
    expect(layoutEngine.evaluate).not.toHaveBeenCalled();
  });

  it('fails with VideoProcessingError when the video processor fails', async () => {
    videoProcessor.fromConfig.mockReturnValue(
      throwError(() => new Error('ffmpeg failed')),
    );

    await expect(createGallery()).rejects.toBeInstanceOf(VideoProcessingError);
  });
});
