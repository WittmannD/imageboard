import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

// Seconds, relative to the (already trimmed) video
export interface VideoTrimOperationArgs {
  start?: number;
  duration?: number;
  end?: number;
}

export const TrimOperation: Operation<'trim'> = {
  process(command: FfmpegCommand, args: VideoTrimOperationArgs): void {
    const offset = args.start ?? 0;
    const length = args.end !== undefined ? args.end - offset : args.duration;
    const remaining =
      command.duration !== undefined ? command.duration - offset : undefined;
    const lengths = [length, remaining].filter((value) => value !== undefined);

    command.start = (command.start ?? 0) + offset;
    command.duration = lengths.length ? Math.min(...lengths) : undefined;

    if (command.duration !== undefined && command.duration <= 0) {
      throw new RangeError('trim must leave a part of the video');
    }
  },
};
