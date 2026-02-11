export interface ImageOutput {
  path: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageProcessingMessage {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides?: Record<string, any>;
}

export interface ImageProcessingResponse {
  images: ImageOutput[];
}
