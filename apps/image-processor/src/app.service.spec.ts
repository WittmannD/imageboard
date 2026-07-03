// app.service.spec.ts

import { Buffer } from 'node:buffer';
import fsPromises from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import path from 'node:path';
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
import { SourceStorageProvider } from './providers/storage/source-storage.provider.js';
import { TransformStorageProvider } from './providers/storage/transform-storage.provider.js';
import type {
  OperationNestedConfigs,
} from './transform/operation/operation-map.js';

describe('AppService', () => {
  let mockConfigService;
  let service: AppService;
  let root: string;
  let mockImageTransformConfigLoader;

  beforeEach(async () => {
    // reset mock call history + implementations between tests
    vi.clearAllMocks();

    root = await fsPromises.mkdtemp(path.resolve('./test', 'app-service-'));

    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: unknown): unknown => {
        const cfg: Record<string, unknown> = {
          SOURCE_STORAGE_PATH: './test',
          TRANSFORM_STORAGE_PATH: root,
        };

        return cfg[key] ?? defaultValue;
      }),
      getOrThrow: vi.fn((key: string): unknown => {
        const cfg: Record<string, unknown> = {
          SOURCE_STORAGE_PATH: './test',
          TRANSFORM_STORAGE_PATH: root,
        };

        if (!(key in cfg)) {
          throw new Error();
        }

        return cfg[key];
      }),
    };

    mockImageTransformConfigLoader = {
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
        SourceStorageProvider,
        TransformStorageProvider,
        AppService,
      ],
    }).compile();

    service = moduleRef.get(AppService);
  });

  afterEach(async () => {
    // remove artifacts
    await fsPromises.rm(root, { recursive: true, force: true });
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
          ] satisfies OperationNestedConfigs,
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
});
