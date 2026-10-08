import type { RedisTransportOptions } from '@hdotu1/redis-transport';

export interface VideoProcessorClientOptions {
  redis: Omit<RedisTransportOptions, 'keyPrefix'>;
}
