// Result of image processing
export interface ImageOutput {
  // Object storage key
  key: string;
  format: string;
  size: number;
  width: number;
  height: number;
  // Custom metadata set in the config
  metadata?: Record<string, unknown>;
}

export interface ImageProcessingMessage {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables?: Record<string, any>;
}

export interface ImageProcessingResponse {
  images: ImageOutput[];
}
