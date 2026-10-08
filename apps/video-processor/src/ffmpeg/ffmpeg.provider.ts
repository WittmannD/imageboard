import type { Provider } from '@nestjs/common';

import { Ffmpeg } from './ffmpeg.js';

// ffmpeg and ffprobe from the PATH; the Docker image installs them
export const FfmpegProvider: Provider<Ffmpeg> = {
  provide: Ffmpeg,
  useFactory: () => new Ffmpeg(),
};
