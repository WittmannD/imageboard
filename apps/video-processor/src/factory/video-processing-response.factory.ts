import type { VideoProcessingResponse } from '@hdotu1/video-processor-contract';

import type { FileOutputInfo } from '../transform/output.js';

export class VideoProcessingResponseFactory {
  createFromFileOutputs(outputs: FileOutputInfo[]): VideoProcessingResponse {
    return {
      outputs: outputs.map((output) => ({
        key: output.key,
        size: output.size,
        width: output.width,
        height: output.height,
        duration: output.duration,
        format: output.format,
        metadata: output.metadata ?? {},
      })),
    };
  }
}
