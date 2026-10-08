import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Inject, Injectable } from '@nestjs/common';
import { defer, Observable } from 'rxjs';

import type { StorageDriver } from '@hdotu1/media-storage/drivers';
import type { VideoProbeResponse } from '@hdotu1/video-processor-contract';

import { Ffmpeg } from './ffmpeg/ffmpeg.js';
import { SOURCE_STORAGE } from './providers/storage/source-storage.provider.js';
import { MEDIA_STORAGE } from './providers/storage/transform-storage.provider.js';
import { JobQueue } from './queue/job-queue.js';
import type { OperationNestedConfigs } from './transform/operation/operation-map.js';
import type { FileOutputInfo } from './transform/output.js';
import { TransformConfigService } from './transform/transform-config.service.js';
import { TransformConfigContext } from './transform/transform-config-context.js';
import { VideoTransformer } from './transform/video-transformer.js';

export const DEFAULT_VIDEO_TRANSFORM_CONFIG = 'video-transform.config.yaml';

@Injectable()
export class AppService {
  constructor(
    @Inject(SOURCE_STORAGE) private sourceStorage: StorageDriver,
    @Inject(MEDIA_STORAGE) private outputStorage: StorageDriver,
    private readonly transformConfigService: TransformConfigService,
    private readonly ffmpeg: Ffmpeg,
    private readonly queue: JobQueue,
  ) {}

  private transform(
    input: string,
    workDir: string,
    operations: OperationNestedConfigs,
  ): Promise<FileOutputInfo[]> {
    return new VideoTransformer(
      operations,
      this.ffmpeg,
      this.outputStorage,
    ).transform(input, workDir);
  }

  /**
   * Downloads the source into a scratch directory - ffmpeg needs a seekable
   * file, e.g. for MP4s with the index at the end - and removes it afterwards.
   */
  private async withSource<T>(
    videoKey: string,
    job: (input: string, workDir: string) => Promise<T>,
  ): Promise<T> {
    const workDir = await mkdtemp(join(tmpdir(), 'video-processor-'));

    try {
      const input = join(workDir, `source${extname(videoKey)}`);
      await pipeline(
        await this.sourceStorage.download(videoKey),
        createWriteStream(input),
      );

      return await job(input, workDir);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  /**
   * The display dimensions of the video. Not queued: probing takes
   * milliseconds, so it should not wait behind encoding jobs.
   */
  public probe(videoKey: string): Observable<VideoProbeResponse> {
    return defer(() =>
      this.withSource(videoKey, async (input) => {
        const { width, height } = await this.ffmpeg.probe(input);

        if (width === undefined || height === undefined) {
          throw new Error(`${videoKey} has no video stream`);
        }

        return { width, height };
      }),
    );
  }

  public process(
    videoKey: string,
    operations: OperationNestedConfigs,
  ): Observable<FileOutputInfo[]> {
    return defer(() =>
      this.queue.run(() =>
        this.withSource(videoKey, (input, workDir) =>
          this.transform(input, workDir, operations),
        ),
      ),
    );
  }

  public processFromConfig(
    videoKey: string,
    variables?: Record<string, unknown>,
    configKey?: string,
  ): Observable<FileOutputInfo[]> {
    configKey = configKey ?? DEFAULT_VIDEO_TRANSFORM_CONFIG;

    return defer(() =>
      this.queue.run(() =>
        this.withSource(videoKey, async (input, workDir) => {
          const metadata = await this.ffmpeg.probe(input);
          const transformConfig =
            await this.transformConfigService.getOrThrow(configKey);
          const context = TransformConfigContext.from({
            metadata,
            variables,
            key: videoKey,
          });
          const config = transformConfig.resolve(context);

          return this.transform(input, workDir, config.transform);
        }),
      ),
    );
  }
}
