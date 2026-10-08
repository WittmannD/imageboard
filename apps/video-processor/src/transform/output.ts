export interface FileOutputInfo {
  filename: string;
  key: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}
