import type { StorageDriver } from '@hdotu1/media-storage/drivers';

import type { Ffmpeg } from '../../ffmpeg/ffmpeg.js';
import type { FileOutputInfo } from '../output.js';

export interface OperationContext {
  ffmpeg: Ffmpeg;
  storage: StorageDriver;
  // Local path of the source video
  input: string;
  // Scratch directory for rendered files, removed after the transform
  workDir: string;
  addOutput(output: FileOutputInfo): void;
}
