import { type FfmpegCommand, finite } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoScaleOperationArgs {
  width?: number;
  height?: number;
  // inside: fit within width x height, keeping the aspect ratio (default)
  // cover: fill width x height, keeping the aspect ratio, cropping the rest
  // fill: stretch to width x height
  fit?: 'inside' | 'cover' | 'fill';
  // Never scale up; not supported with `cover`
  withoutEnlargement?: boolean;
}

export const ScaleOperation: Operation<'scale'> = {
  process(command: FfmpegCommand, args: VideoScaleOperationArgs): void {
    const fit = args.fit ?? 'inside';
    const width =
      args.width === undefined ? undefined : finite(args.width, 'width');
    const height =
      args.height === undefined ? undefined : finite(args.height, 'height');

    if (width === undefined && height === undefined) {
      throw new TypeError('scale needs a width or a height');
    }

    // -2 keeps the aspect ratio, rounded to the even sizes encoders require
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

    if (fit === 'inside') {
      command.videoFilters.push(
        `scale=${box}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
        'setsar=1',
      );
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
