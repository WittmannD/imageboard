export interface ImageOutput {
  key: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageProcessingMessage {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables?: Record<string, any>;
}

export interface ImageProcessingResponse {
  images: ImageOutput[];
}
