import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { rm, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';
import type { OperationContext } from './operation-context.js';

export interface VideoSaveOperationArgs {
  key: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export const SaveOperation: Operation<'save'> = {
  async process(
    command: FfmpegCommand,
    args: VideoSaveOperationArgs,
    context: OperationContext,
  ): Promise<void> {
    const extension = extname(args.key);
    // the extension lets ffmpeg pick the format when no encoder operation did
    const path = join(context.workDir, `${randomUUID()}${extension}`);

    try {
      await context.ffmpeg.run(command.toArgs(context.input, path));

      // e.g. a frame past the end of the video renders nothing
      const size = await stat(path).then(
        (stats) => stats.size,
        () => 0,
      );
      if (size === 0) {
        throw new Error(`ffmpeg rendered nothing for ${args.key}`);
      }

      const probe = await context.ffmpeg.probe(path);
      const still = command.encoder?.still ?? false;

      await context.storage.upload({
        key: args.key,
        body: createReadStream(path),
        contentType: args.contentType,
      });

      context.addOutput({
        key: args.key,
        filename: basename(args.key),
        format: command.encoder?.format ?? extension.slice(1),
        size,
        width: probe.width,
        height: probe.height,
        duration: still ? undefined : probe.duration,
        metadata: args.metadata,
      });
    } finally {
      await rm(path, { force: true });
    }
  },
};
