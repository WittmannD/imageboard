import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export interface VideoH264OperationArgs {
  // 0-51, lower is better
  crf?: number;
  preset?:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow';
  // e.g. 128k
  audioBitrate?: string;
  // Moves the index to the start of the file, so playback starts before the download ends
  faststart?: boolean;
}

/** H.264/AAC in MP4. */
export const H264Operation: Operation<'h264'> = {
  process(command: FfmpegCommand, args: VideoH264OperationArgs): void {
    command.encoder = {
      format: 'mp4',
      muxer: 'mp4',
      videoOptions: [
        '-c:v',
        'libx264',
        '-preset',
        args.preset ?? 'medium',
        '-crf',
        String(args.crf ?? 23),
        // the only pixel format every browser decodes
        '-pix_fmt',
        'yuv420p',
      ],
      audioOptions: ['-c:a', 'aac', '-b:a', args.audioBitrate ?? '128k'],
      muxerOptions: args.faststart === false ? [] : ['-movflags', '+faststart'],
      still: false,
    };
  },
};
