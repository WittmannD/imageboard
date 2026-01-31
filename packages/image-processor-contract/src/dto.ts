export interface ImageFromConfigRequest {
  path: string;
  mimetype: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides: Record<string, any>;
}

export interface ImageFromConfigResponse {
  path: string;
}
