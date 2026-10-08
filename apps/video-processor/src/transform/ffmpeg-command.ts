export interface Encoder {
  // Output format reported to clients, e.g. "mp4" or "jpeg"
  format: string;
  // ffmpeg muxer (-f)
  muxer: string;
  videoOptions: string[];
  audioOptions: string[];
  muxerOptions: string[];
  // Produces a single image instead of a video
  still: boolean;
}

/**
 * The ffmpeg invocation of one transform branch, built up by its operations
 * and rendered by `save`. Forked branches work on clones.
 */
export class FfmpegCommand {
  // Seconds, applied as input options so ffmpeg seeks instead of decoding
  public start?: number;
  public duration?: number;
  public readonly videoFilters: string[] = [];
  public mute = false;
  public encoder?: Encoder;

  public clone(): FfmpegCommand {
    const command = new FfmpegCommand();
    command.start = this.start;
    command.duration = this.duration;
    command.videoFilters.push(...this.videoFilters);
    command.mute = this.mute;
    command.encoder = this.encoder && {
      ...this.encoder,
      videoOptions: [...this.encoder.videoOptions],
      audioOptions: [...this.encoder.audioOptions],
      muxerOptions: [...this.encoder.muxerOptions],
    };
    return command;
  }

  public toArgs(input: string, output: string): string[] {
    const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y'];

    if (this.start !== undefined) args.push('-ss', String(this.start));
    if (this.duration !== undefined) args.push('-t', String(this.duration));
    args.push('-i', input);

    // only the first stream of each kind, so extra tracks never break a muxer
    args.push('-map', '0:v:0');
    if (!this.mute && !this.encoder?.still) args.push('-map', '0:a:0?');

    if (this.videoFilters.length) {
      args.push('-vf', this.videoFilters.join(','));
    }

    if (this.encoder) {
      args.push(...this.encoder.videoOptions);
      if (!this.mute) args.push(...this.encoder.audioOptions);
      args.push(...this.encoder.muxerOptions, '-f', this.encoder.muxer);
    }

    if (this.mute) args.push('-an');
    // drop the source's metadata (location, device, ...) from the outputs
    args.push('-map_metadata', '-1', output);

    return args;
  }
}

/** Guards numbers interpolated into filter strings against filter injection. */
export function finite(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }

  return value;
}
