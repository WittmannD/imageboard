import { spawn } from 'node:child_process';

import { parseProbe, type ProbeResult, type VideoMetadata } from './probe.js';

export interface FfmpegOptions {
  ffmpegPath?: string;
  ffprobePath?: string;
}

// stderr kept for error messages; ffmpeg prints the actual error last
const STDERR_TAIL_BYTES = 4096;

export class Ffmpeg {
  private readonly ffmpegPath: string;
  private readonly ffprobePath: string;

  constructor(options: FfmpegOptions = {}) {
    this.ffmpegPath = options.ffmpegPath ?? 'ffmpeg';
    this.ffprobePath = options.ffprobePath ?? 'ffprobe';
  }

  public async run(args: readonly string[]): Promise<void> {
    await this.exec(this.ffmpegPath, args);
  }

  public async probe(path: string): Promise<VideoMetadata> {
    const stdout = await this.exec(this.ffprobePath, [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      path,
    ]);

    return parseProbe(JSON.parse(stdout) as ProbeResult);
  }

  private exec(command: string, args: readonly string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // no shell: arguments reach the binary as they are
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      const stdout: Buffer[] = [];
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout.push(chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = (stderr + chunk.toString()).slice(-STDERR_TAIL_BYTES);
      });

      child.once('error', (error) => {
        reject(new Error(`Could not start ${command}`, { cause: error }));
      });
      child.once('close', (code, signal) => {
        if (code === 0) {
          resolve(Buffer.concat(stdout).toString());
          return;
        }

        const status = signal ?? `exit code ${String(code)}`;
        reject(new Error(`${command} failed (${status}): ${stderr.trim()}`));
      });
    });
  }
}
