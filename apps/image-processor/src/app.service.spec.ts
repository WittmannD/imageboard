// app.service.spec.ts

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { YamlTemplate } from '@hdotu1/yaml-template';

import { AppService } from './app.service.js';
import {
  IMAGE_TRANSFORM_CONFIG_LOADER,
  type ImageTransformConfig,
} from './config/image-transform-config.js';
import {
  FsMediaSource,
  type FsMediaSourceOptions,
} from './media-source/fs-media-source.js';
import { MEDIA_SOURCE } from './media-source/media-source.js';
import {
  FsMediaStorage,
  type FsMediaStorageOptions,
} from './media-storage/fs-media-storage.js';
import { MEDIA_STORAGE } from './media-storage/media-storage.js';
import type { NestedTransformOperation } from './transform/operation/options.js';

describe('AppService', () => {
  let service: AppService;

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: unknown): unknown => {
      const cfg = {
        'media-source': {
          basePath: './test',
        } as unknown as FsMediaSourceOptions,
        'media-storage': {
          basePath: './test',
        } as unknown as FsMediaStorageOptions,
      };

      if (key === 'image-processor-config') {
        return cfg;
      }

      if (key === 'image-processor-config.media-storage') {
        return cfg['media-storage'];
      }

      if (key === 'image-processor-config.media-source') {
        return cfg['media-source'];
      }

      return defaultValue;
    }),
  };

  const mockImageTransformConfigLoader = {
    get: vi.fn((): Promise<YamlTemplate<ImageTransformConfig>> => {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const schemaPath = resolve(
        __dirname,
        './schema/image-transform-config.schema.json',
      );

      return YamlTemplate.create(
        Buffer.from(
          `$schema: '${schemaPath}'
transform:
  - operation: resize
    args:
      width: 200
      height: 200
  - operation: save
    args:
      key: '\${{file.name}}_200x200\${{file.ext}}'`,
          'utf-8',
        ),
      );
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
          provide: IMAGE_TRANSFORM_CONFIG_LOADER,
          useValue: mockImageTransformConfigLoader,
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
        {
          inject: [ConfigService],
          provide: MEDIA_STORAGE,
          useFactory: (configService: ConfigService) =>
            new FsMediaStorage(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              configService.get<FsMediaStorageOptions>(
                'image-processor-config.media-storage',
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
            key: 'resized.jpeg',
          },
        },
      ]);
      expect(result).toBeInstanceOf(Observable);

      const promise = firstValueFrom(result);
      await expect(promise).resolves.toMatchObject([
        {
          key: 'resized.jpeg',
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
              key: 'resized300x300.jpeg',
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
              key: 'resized200x200.jpeg',
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
            key: 'resized200x200.jpeg',
          }),
          expect.objectContaining({
            width: 300,
            height: 300,
            key: 'resized300x300.jpeg',
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
                key: `converted.${format}`,
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
              key: `converted.${format}`,
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
          key: 'original_200x200.jpeg',
          filename: 'original_200x200.jpeg',
          format: 'jpeg',
          width: 200,
          height: 200,
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
