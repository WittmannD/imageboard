import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import fsPromises from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { LocalStorageDriver } from '@hdotu1/media-storage/drivers';
import { YamlTemplate } from '@hdotu1/yaml-template';

import { AppService, DEFAULT_VIDEO_TRANSFORM_CONFIG } from './app.service.js';
import { Ffmpeg } from './ffmpeg/ffmpeg.js';
import { SOURCE_STORAGE } from './providers/storage/source-storage.provider.js';
import { MEDIA_STORAGE } from './providers/storage/transform-storage.provider.js';
import { JobQueue } from './queue/job-queue.js';
import {
  TransformConfigService,
  type VideoTransformConfig,
} from './transform/transform-config.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(
  __dirname,
  './schema/video-transform-config.schema.json',
);
const testRoot = resolve(__dirname, '../test');

// Encoding needs the ffmpeg and ffprobe binaries; the Docker image and the
// GitHub runners have them, a dev machine may not.
const hasFfmpeg = ['ffmpeg', 'ffprobe'].every(
  (binary) => spawnSync(binary, ['-version']).status === 0,
);

const DEFAULT_CONFIG_YAML = `transform:
  - operation: scale
    args:
      width: 320
  - operation: h264
    args:
      preset: ultrafast
  - operation: save
    args:
      key: '\${{file.name}}/320.mp4'`;

describe.runIf(hasFfmpeg)('AppService', { timeout: 60_000 }, () => {
  const ffmpeg = new Ffmpeg();
  let sourceRoot: string;
  let root: string;
  let service: AppService;
  let configYaml: string;
  let mockTransformConfigService: {
    getOrThrow: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    await fsPromises.mkdir(testRoot, { recursive: true });
    sourceRoot = await fsPromises.mkdtemp(path.join(testRoot, 'source-'));

    // 2 seconds of 640x360 test pattern with a sine tone
    await ffmpeg.run([
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=640x360:rate=25:duration=2',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=2',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-shortest',
      path.join(sourceRoot, 'original.mp4'),
    ]);
  });

  afterAll(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    root = await fsPromises.mkdtemp(path.join(testRoot, 'app-service-'));
    configYaml = DEFAULT_CONFIG_YAML;

    mockTransformConfigService = {
      getOrThrow: vi.fn((): Promise<YamlTemplate<VideoTransformConfig>> =>
        YamlTemplate.create<VideoTransformConfig>(
          Buffer.from(configYaml, 'utf-8'),
          { overrideSchema: schemaPath },
        ),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TransformConfigService,
          useValue: mockTransformConfigService,
        },
        {
          provide: SOURCE_STORAGE,
          useValue: new LocalStorageDriver({ root: sourceRoot }),
        },
        {
          provide: MEDIA_STORAGE,
          useValue: new LocalStorageDriver({ root }),
        },
        { provide: Ffmpeg, useValue: ffmpeg },
        { provide: JobQueue, useValue: new JobQueue(1) },
        AppService,
      ],
    }).compile();

    service = moduleRef.get(AppService);
  });

  afterEach(async () => {
    await fsPromises.rm(root, { recursive: true, force: true });
  });

  describe('process', () => {
    it('transcodes and writes the output to transform storage', async () => {
      const outputs = await firstValueFrom(
        service.process('original.mp4', [
          { operation: 'scale', args: { width: 320 } },
          { operation: 'h264', args: { preset: 'ultrafast' } },
          {
            operation: 'save',
            args: { key: 'nested/small.mp4', metadata: { variant: 'small' } },
          },
        ]),
      );

      expect(outputs).toEqual([
        expect.objectContaining({
          key: 'nested/small.mp4',
          filename: 'small.mp4',
          format: 'mp4',
          width: 320,
          height: 180,
          metadata: { variant: 'small' },
        }),
      ]);
      expect(outputs[0]?.duration).toBeCloseTo(2, 0);

      const stored = await ffmpeg.probe(path.join(root, 'nested/small.mp4'));
      expect(stored).toMatchObject({
        width: 320,
        height: 180,
        videoCodec: 'h264',
        audioCodec: 'aac',
      });
      expect(outputs[0]?.size).toBe(
        (await fsPromises.stat(path.join(root, 'nested/small.mp4'))).size,
      );
    });

    it('forks nested operations without affecting the others', async () => {
      const outputs = await firstValueFrom(
        service.process('original.mp4', [
          { operation: 'h264', args: { preset: 'ultrafast' } },
          [
            { operation: 'trim', args: { duration: 1 } },
            { operation: 'mute', args: {} },
            { operation: 'save', args: { key: 'short.mp4' } },
          ],
          { operation: 'save', args: { key: 'full.mp4' } },
        ]),
      );

      const short = outputs.find((output) => output.key === 'short.mp4');
      const full = outputs.find((output) => output.key === 'full.mp4');
      expect(short?.duration).toBeCloseTo(1, 0);
      expect(full?.duration).toBeCloseTo(2, 0);

      await expect(
        ffmpeg.probe(path.join(root, 'short.mp4')),
      ).resolves.toMatchObject({ hasAudio: false });
      await expect(
        ffmpeg.probe(path.join(root, 'full.mp4')),
      ).resolves.toMatchObject({ hasAudio: true });
    });

    it('extracts a frame as an image', async () => {
      const formats = ['jpeg', 'png', 'webp'] as const;
      const outputs = await firstValueFrom(
        service.process(
          'original.mp4',
          formats.map((format) => [
            { operation: 'frame', args: { time: 1, format } },
            { operation: 'save', args: { key: `poster.${format}` } },
          ]),
        ),
      );

      expect(outputs).toEqual(
        formats.map((format) => ({
          key: `poster.${format}`,
          filename: `poster.${format}`,
          format,
          size: expect.any(Number),
          width: 640,
          height: 360,
          duration: undefined,
          metadata: undefined,
        })),
      );
    });

    it('encodes vp9 webm', async () => {
      const outputs = await firstValueFrom(
        service.process('original.mp4', [
          { operation: 'scale', args: { width: 160 } },
          { operation: 'vp9', args: { speed: 8 } },
          { operation: 'save', args: { key: 'small.webm' } },
        ]),
      );

      expect(outputs).toMatchObject([
        { key: 'small.webm', format: 'webm', width: 160, height: 90 },
      ]);
      await expect(
        ffmpeg.probe(path.join(root, 'small.webm')),
      ).resolves.toMatchObject({ videoCodec: 'vp9', audioCodec: 'opus' });
    });

    it('fails when ffmpeg renders nothing', async () => {
      await expect(
        firstValueFrom(
          service.process('original.mp4', [
            { operation: 'frame', args: { time: 30 } },
            { operation: 'save', args: { key: 'past-the-end.jpeg' } },
          ]),
        ),
      ).rejects.toThrow('ffmpeg rendered nothing for past-the-end.jpeg');
    });

    it('fails with the ffmpeg error', async () => {
      await expect(
        firstValueFrom(
          service.process('original.mp4', [
            { operation: 'crop', args: { width: 4000, height: 4000 } },
            { operation: 'save', args: { key: 'too-large.mp4' } },
          ]),
        ),
      ).rejects.toThrow(/ffmpeg failed/);
    });

    it('removes the scratch directory', async () => {
      const scratchDirs = async () =>
        (await fsPromises.readdir(tmpdir())).filter((name) =>
          name.startsWith('video-processor-'),
        );
      const before = await scratchDirs();

      await firstValueFrom(
        service.process('original.mp4', [
          { operation: 'frame', args: {} },
          { operation: 'save', args: { key: 'poster.jpeg' } },
        ]),
      );

      await expect(scratchDirs()).resolves.toEqual(before);
    });
  });

  describe('processFromConfig', () => {
    it('reads from config', async () => {
      await expect(
        firstValueFrom(service.processFromConfig('original.mp4')),
      ).resolves.toMatchObject([
        { key: 'original/320.mp4', width: 320, height: 180 },
      ]);
    });

    it('loads the default config when no config key is given', async () => {
      await firstValueFrom(service.processFromConfig('original.mp4'));

      expect(mockTransformConfigService.getOrThrow).toHaveBeenCalledWith(
        DEFAULT_VIDEO_TRANSFORM_CONFIG,
      );
    });

    it('loads the given config key', async () => {
      await firstValueFrom(
        service.processFromConfig(
          'original.mp4',
          undefined,
          'other-transform.config.yaml',
        ),
      );

      expect(mockTransformConfigService.getOrThrow).toHaveBeenCalledWith(
        'other-transform.config.yaml',
      );
    });

    it('resolves variables and source metadata in config', async () => {
      configYaml = `transform:
  - operation: frame
    args:
      time: \${{variables.time}}
  - operation: scale
    args:
      width: \${{variables.width}}
  - operation: save
    args:
      key: '\${{variables.prefix}}/\${{file.name}}.jpeg'
      metadata:
        sourceWidth: \${{metadata.width}}
        sourceHasAudio: \${{metadata.hasAudio}}`;

      const outputs = await firstValueFrom(
        service.processFromConfig('original.mp4', {
          prefix: 'user-1',
          time: '0.5',
          width: '160',
        }),
      );

      expect(outputs).toMatchObject([
        {
          key: 'user-1/original.jpeg',
          width: 160,
          height: 90,
          metadata: { sourceWidth: 640, sourceHasAudio: true },
        },
      ]);
    });

    it('runs the shipped default config', async () => {
      configYaml = await fsPromises.readFile(
        resolve(__dirname, '../config', DEFAULT_VIDEO_TRANSFORM_CONFIG),
        'utf-8',
      );

      const outputs = await firstValueFrom(
        service.processFromConfig('original.mp4'),
      );

      expect(outputs).toMatchObject([
        {
          key: 'original/video.mp4',
          format: 'mp4',
          width: 640,
          height: 360,
          metadata: { variant: 'video', hasAudio: true },
        },
        { key: 'original/poster.jpeg', format: 'jpeg', width: 640 },
        { key: 'original/preview.mp4', format: 'mp4', width: 480, height: 270 },
      ]);
      expect(outputs[2]?.duration).toBeCloseTo(2, 0);
    });

    it('rejects variables that are not valid operation args', async () => {
      configYaml = `transform:
  - operation: scale
    args:
      width: '\${{variables.width}}'
  - operation: save
    args:
      key: out.mp4`;

      await expect(
        firstValueFrom(
          service.processFromConfig('original.mp4', {
            width: '1:x,movie=/etc/passwd',
          }),
        ),
      ).rejects.toThrow(/width/);
      await expect(fsPromises.readdir(root)).resolves.toEqual([]);
    });
  });
});
