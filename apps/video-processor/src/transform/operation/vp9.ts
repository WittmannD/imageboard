import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoVp9OperationArgs {
  // 0-63, lower is better
  crf?: number;
  // 0-8, higher is faster
  speed?: number;
  // e.g. 96k
  audioBitrate?: string;
}

/** VP9/Opus in WebM. */
export const Vp9Operation: Operation<'vp9'> = {
  process(command: FfmpegCommand, args: VideoVp9OperationArgs): void {
    command.encoder = {
      format: 'webm',
      muxer: 'webm',
      videoOptions: [
        '-c:v',
        'libvpx-vp9',
        // constant quality mode
        '-crf',
        String(args.crf ?? 32),
        '-b:v',
        '0',
        '-cpu-used',
        String(args.speed ?? 2),
        '-row-mt',
        '1',
        '-pix_fmt',
        'yuv420p',
      ],
      audioOptions: ['-c:a', 'libopus', '-b:a', args.audioBitrate ?? '96k'],
      muxerOptions: [],
      still: false,
    };
  },
};
