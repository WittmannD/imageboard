import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoFrameOperationArgs {
  // Seconds, relative to the (trimmed) video
  time?: number;
  format?: 'jpeg' | 'png' | 'webp';
  // 1-100, for jpeg and webp
  quality?: number;
}

function getCodecOptions(args: VideoFrameOperationArgs): string[] {
  const quality = args.quality ?? 80;

  switch (args.format ?? 'jpeg') {
    case 'jpeg': {
      // the mjpeg scale runs from 2 (best) to 31 (worst)
      const qscale = Math.round(31 - (quality / 100) * 29);
      return ['-c:v', 'mjpeg', '-q:v', String(qscale)];
    }
    case 'png':
      return ['-c:v', 'png'];
    case 'webp':
      return ['-c:v', 'libwebp', '-quality', String(quality)];
  }
}

/** Extracts a single frame as an image, e.g. a poster. */
export const FrameOperation: Operation<'frame'> = {
  process(command: FfmpegCommand, args: VideoFrameOperationArgs): void {
    command.start = (command.start ?? 0) + (args.time ?? 0);
    command.duration = undefined;
    command.encoder = {
      format: args.format ?? 'jpeg',
      muxer: 'image2',
      videoOptions: ['-frames:v', '1', ...getCodecOptions(args)],
      audioOptions: [],
      // write one file instead of an image sequence
      muxerOptions: ['-update', '1'],
      still: true,
    };
  },
};
