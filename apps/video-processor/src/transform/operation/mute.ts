import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { Operation } from './operation.js';

export type VideoMuteOperationArgs = Record<string, never>;

/** Drops the audio. */
export const MuteOperation: Operation<'mute'> = {
  process(command: FfmpegCommand): void {
    command.mute = true;
  },
};
