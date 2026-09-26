// app.service.spec.ts

import { Buffer } from 'node:buffer';
import fsPromises from 'node:fs/promises';
import path, { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import { firstValueFrom, Observable } from 'rxjs';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageDriver } from '@hdotu1/media-storage/drivers';
import { YamlTemplate } from '@hdotu1/yaml-template';

import { AppService } from './app.service.js';
import {
  DEFAULT_IMAGE_TRANSFORM_CONFIG,
  IMAGE_TRANSFORM_CONFIG_LOADER,
  type ImageTransformConfig,
} from './providers/image-transform-config.js';
import { SOURCE_STORAGE } from './providers/storage/source-storage.provider.js';
import { TRANSFORM_STORAGE } from './providers/storage/transform-storage.provider.js';
import type { OperationNestedConfigs } from './transform/operation/operation-map.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(
  __dirname,
  './schema/image-transform-config.schema.json',
);
const sourceRoot = resolve(__dirname, '../test');

const DEFAULT_CONFIG_YAML = `$schema: '${schemaPath}'
transform:
  - operation: resize
    args:
      width: 200
      height: 200
  - operation: save
    args:
      key: '\${{file.name}}_200x200\${{file.ext}}'`;

describe('AppService', () => {
  let service: AppService;
  let root: string;
  let configYaml: string;
  let mockImageTransformConfigLoader: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // reset mock call history + implementations between tests
    vi.clearAllMocks();

    root = await fsPromises.mkdtemp(path.join(sourceRoot, 'app-service-'));
    configYaml = DEFAULT_CONFIG_YAML;

    mockImageTransformConfigLoader = {
      get: vi.fn((): Promise<YamlTemplate<ImageTransformConfig>> =>
        YamlTemplate.create<ImageTransformConfig>(
          Buffer.from(configYaml, 'utf-8'),
        ),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: IMAGE_TRANSFORM_CONFIG_LOADER,
          useValue: mockImageTransformConfigLoader,
        },
        {
          provide: SOURCE_STORAGE,
          useValue: new LocalStorageDriver({ root: sourceRoot }),
        },
        {
          provide: TRANSFORM_STORAGE,
          useValue: new LocalStorageDriver({ root }),
        },
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

    it('writes output to transform storage', async () => {
      await firstValueFrom(
        service.process('original.jpeg', [
          {
            operation: 'resize',
            args: {
              width: 120,
              height: 80,
            },
          },
          {
            operation: 'save',
            args: {
              key: 'nested/stored.jpeg',
            },
          },
        ]),
      );

      const metadata = await sharp(
        path.join(root, 'nested/stored.jpeg'),
      ).metadata();
      expect(metadata).toMatchObject({
        format: 'jpeg',
        width: 120,
        height: 80,
      });
    });

    it('passes save metadata through to outputs', async () => {
      const outputs = await firstValueFrom(
        service.process('original.jpeg', [
          {
            operation: 'save',
            args: {
              key: 'with-metadata.jpeg',
              metadata: { variant: 'original' },
            },
          },
        ]),
      );

      expect(outputs).toMatchObject([
        {
          key: 'with-metadata.jpeg',
          metadata: { variant: 'original' },
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

    it('loads the default config when no config key is given', async () => {
      await firstValueFrom(service.processFromConfig('original.jpeg'));

      expect(mockImageTransformConfigLoader.get).toHaveBeenCalledWith(
        DEFAULT_IMAGE_TRANSFORM_CONFIG,
      );
    });

    it('loads the given config key', async () => {
      await firstValueFrom(
        service.processFromConfig(
          'original.jpeg',
          undefined,
          'avatar-transform.config.yaml',
        ),
      );

      expect(mockImageTransformConfigLoader.get).toHaveBeenCalledWith(
        'avatar-transform.config.yaml',
      );
    });

    it('resolves variables and source metadata in config', async () => {
      configYaml = `$schema: '${schemaPath}'
transform:
  - operation: save
    args:
      key: '\${{variables.prefix}}/\${{file.name}}\${{file.ext}}'
      metadata:
        sourceWidth: \${{metadata.width}}`;

      const { width } = await sharp(
        path.join(sourceRoot, 'original.jpeg'),
      ).metadata();
      const outputs = await firstValueFrom(
        service.processFromConfig('original.jpeg', { prefix: 'user-1' }),
      );

      expect(outputs).toMatchObject([
        {
          key: 'user-1/original.jpeg',
          filename: 'original.jpeg',
          metadata: { sourceWidth: width },
        },
      ]);
    });
  });
});
