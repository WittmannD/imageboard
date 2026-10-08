import { type FfmpegCommand, finite } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoCropOperationArgs {
  width: number;
  height: number;
  // Top left corner; the crop is centered when omitted
  x?: number;
  y?: number;
}

export const CropOperation: Operation<'crop'> = {
  process(command: FfmpegCommand, args: VideoCropOperationArgs): void {
    const values = [finite(args.width, 'width'), finite(args.height, 'height')];

    if (args.x !== undefined || args.y !== undefined) {
      values.push(finite(args.x ?? 0, 'x'), finite(args.y ?? 0, 'y'));
    }

    command.videoFilters.push(`crop=${values.map(String).join(':')}`);
  },
};
