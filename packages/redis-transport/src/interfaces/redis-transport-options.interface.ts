export interface RedisTransportOptions {
  host?: string;
  port?: number;
  keyPrefix?: string;
  retryAttempts?: number;
  retryDelay?: number;
}
