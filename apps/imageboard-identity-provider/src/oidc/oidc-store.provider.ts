import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_STORE = Symbol('REDIS_STORE');
export const RedisStoreProvider = {
  provide: REDIS_STORE,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.getOrThrow<string>('REDIS_HOST'),
      port: Number(configService.getOrThrow<string>('REDIS_PORT')),
      keyPrefix: 'odic:',
    })
  },
  inject: [ConfigService]
} satisfies Provider<Redis>;
