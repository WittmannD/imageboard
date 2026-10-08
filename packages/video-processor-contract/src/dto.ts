// Result of video processing: a transcoded video or an extracted frame
export interface VideoOutput {
  // Object storage key
  key: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  // Seconds; absent for still images (extracted frames)
  duration?: number;
  // Custom metadata set in the config
  metadata?: Record<string, unknown>;
}

export interface VideoProcessingMessage {
  key: string;
  configKey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables?: Record<string, any>;
}

export interface VideoProcessingResponse {
  outputs: VideoOutput[];
}
