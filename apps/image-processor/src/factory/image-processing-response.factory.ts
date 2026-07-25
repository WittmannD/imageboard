import type { ImageProcessingResponse } from '@hdotu1/image-processor-contract';

import type { FileOutputInfo } from '../transform/events.js';

export class ImageProcessingResponseFactory {
  createFromFileOutputs(outputs: FileOutputInfo[]): ImageProcessingResponse {
    return {
      images: outputs.map((output) => ({
        key: output.key,
        size: output.size,
        width: output.width,
        height: output.height,
        format: output.format,
        metadata: output.metadata ?? {}
      })),
    };
  }
}
