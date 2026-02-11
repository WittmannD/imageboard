// app.service.spec.ts

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppService } from './app.service.js';
import type { ImageProcessorConfig } from './config/image-processor-config.js';
import {
  FsMediaSource,
  type FsMediaSourceOptions,
} from './media-source/fs-media-source.js';
import { MEDIA_SOURCE } from './media-source/media-source.js';
import type { NestedTransformOperation } from './transform/operation/options.js';

describe('AppService', () => {
  let service: AppService;

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: unknown) => {
      if (key === 'image-processor-config.media-source') {
        return {
          basePath: './test',
        } as unknown as FsMediaSourceOptions;
      }

      if (key === 'image-processor-config') {
        return {
          transform: [
            {
              operation: 'resize',
              args: {
                width: 300,
                height: 300,
              },
            },
            {
              operation: 'save',
              args: {
                path: './test/modified.jpeg',
              },
            },
          ],
        } as ImageProcessorConfig;
      }

      return defaultValue;
    }),
  };

  beforeEach(async () => {
    // reset mock call history + implementations between tests
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          inject: [ConfigService],
          provide: MEDIA_SOURCE,
          useFactory: (configService: ConfigService) =>
            new FsMediaSource(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              configService.get<FsMediaSourceOptions>(
                'image-processor-config.media-source',
              )!,
            ),
        },
        AppService,
      ],
    }).compile();

    service = moduleRef.get(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('resizes image', async () => {
      const result = service.process('original.jpeg', [
        {
          operation: 'resize',
          args: {
            width: 300,
            height: 300,
          },
        },
        {
          operation: 'save',
          args: {
            path: './test/resized.jpeg',
          },
        },
      ]);
      expect(result).toBeInstanceOf(Observable);

      const promise = firstValueFrom(result);
      await expect(promise).resolves.toMatchObject([
        {
          path: './test/resized.jpeg',
          filename: 'resized.jpeg',
          format: 'jpeg',
          width: 300,
          height: 300,
        },
      ]);
    });

    it('saves multiple files', async () => {
      const result = service.process('original.jpeg', [
        [
          {
            operation: 'resize',
            args: {
              width: 300,
              height: 300,
            },
          },
          {
            operation: 'save',
            args: {
              path: './test/resized300x300.jpeg',
            },
          },
        ],
        [
          {
            operation: 'resize',
            args: {
              width: 200,
              height: 200,
            },
          },
          {
            operation: 'save',
            args: {
              path: './test/resized200x200.jpeg',
            },
          },
        ],
      ]);
      expect(result).toBeInstanceOf(Observable);
      const outputs = await firstValueFrom(result);

      expect(outputs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: 200,
            height: 200,
            path: './test/resized200x200.jpeg',
          }),
          expect.objectContaining({
            width: 300,
            height: 300,
            path: './test/resized300x300.jpeg',
          }),
        ]),
      );
    });

    it('saves in different formats', async () => {
      const formats = ['webp', 'jpeg', 'png', 'avif'] as const;
      const saveOperations = formats.map(
        (format) =>
          [
            {
              operation: format,
              args: {
                quality: 88,
              },
            },
            {
              operation: 'save',
              args: {
                path: `./test/converted.${format}`,
              },
            },
          ] satisfies NestedTransformOperation,
      );
      const result = service.process('original.jpeg', [
        {
          operation: 'resize',
          args: {
            width: 300,
            height: 300,
          },
        },
        ...saveOperations,
      ]);

      expect(result).toBeInstanceOf(Observable);
      const outputs = await firstValueFrom(result);

      expect(outputs).toHaveLength(formats.length);
      expect(outputs).toEqual(
        expect.arrayContaining(
          formats.map((format) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect.objectContaining({
              path: `./test/converted.${format}`,
            }),
          ),
        ),
      );
    });
  });

  describe('processFromConfig', () => {
    it('reads from config', async () => {
      const result = service.processFromConfig('original.jpeg');
      expect(result).toBeInstanceOf(Observable);

      const promise = firstValueFrom(result);
      await expect(promise).resolves.toMatchObject([
        {
          path: './test/modified.jpeg',
          filename: 'modified.jpeg',
          format: 'jpeg',
          width: 300,
          height: 300,
        },
      ]);
    });
  });

  afterEach(async () => {
    const files = fs.globSync('./test/*.*', {
      exclude: ['test\\original.jpeg'],
    });
    if (files.length === 0) {
      return;
    }

    await Promise.allSettled(
      files.map(async (file) => {
        return fsPromises.unlink(file);
      }),
    );
  });
});
