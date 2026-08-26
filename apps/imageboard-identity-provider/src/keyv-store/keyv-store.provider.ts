import KeyvRedis, { Keyv } from '@keyv/redis';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const KEYV_STORE = Symbol('KEYV_STORE');
export const KeyvStoreProvider = {
  
  provide: KEYV_STORE,
  useFactory: (configService: ConfigService) => {
    return new Keyv({
      store: new KeyvRedis({
        url: configService.getOrThrow<string>('redisUrl'),
      }),
      namespace: 'oidc'
    })
  },
  inject: [ConfigService]
} satisfies Provider<Keyv>;