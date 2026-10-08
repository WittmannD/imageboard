import { type FfmpegCommand, finite } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoScaleOperationArgs {
  width?: number;
  height?: number;
  // inside: fit within width x height, keeping the aspect ratio (default)
  // contain: as inside, then letterboxed to exactly width x height
  // cover: fill width x height, keeping the aspect ratio, cropping the rest
  // fill: stretch to width x height
  fit?: 'inside' | 'contain' | 'cover' | 'fill';
  // Never scale up; not supported with `cover`
  withoutEnlargement?: boolean;
}

// yuv420p, which every browser decodes, needs even dimensions, so sizes are
// rounded down to one - e.g. a 241 x 393 gallery tile renders 240 x 392
function toEven(value: number): number {
  return Math.max(2, Math.floor(value / 2) * 2);
}

export const ScaleOperation: Operation<'scale'> = {
  process(command: FfmpegCommand, args: VideoScaleOperationArgs): void {
    const fit = args.fit ?? 'inside';
    const width =
      args.width === undefined
        ? undefined
        : toEven(finite(args.width, 'width'));
    const height =
      args.height === undefined
        ? undefined
        : toEven(finite(args.height, 'height'));

    if (width === undefined && height === undefined) {
      throw new TypeError('scale needs a width or a height');
    }

    // -2 keeps the aspect ratio, rounded to an even size
    const size = (value: number | undefined, input: 'iw' | 'ih') => {
      if (value === undefined) return '-2';
      return args.withoutEnlargement
        ? `'min(${String(value)},${input})'`
        : String(value);
    };
    const box = `w=${size(width, 'iw')}:h=${size(height, 'ih')}`;

    if (width === undefined || height === undefined || fit === 'fill') {
      command.videoFilters.push(`scale=${box}`, 'setsar=1');
      return;
    }

    if (fit === 'inside' || fit === 'contain') {
      command.videoFilters.push(
        `scale=${box}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      );

      if (fit === 'contain') {
        command.videoFilters.push(
          `pad=${String(width)}:${String(height)}:(ow-iw)/2:(oh-ih)/2`,
        );
      }

      command.videoFilters.push('setsar=1');
      return;
    }

    if (args.withoutEnlargement) {
      throw new TypeError('scale with fit cover cannot be withoutEnlargement');
    }

    command.videoFilters.push(
      `scale=${box}:force_original_aspect_ratio=increase`,
      `crop=${String(width)}:${String(height)}`,
      'setsar=1',
    );
  },
};
