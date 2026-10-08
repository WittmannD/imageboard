import { type FfmpegCommand, finite } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoFpsOperationArgs {
  fps: number;
}

export const FpsOperation: Operation<'fps'> = {
  process(command: FfmpegCommand, args: VideoFpsOperationArgs): void {
    command.videoFilters.push(`fps=${String(finite(args.fps, 'fps'))}`);
  },
};
