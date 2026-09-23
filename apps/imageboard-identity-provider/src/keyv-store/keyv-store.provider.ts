import KeyvRedis, { Keyv } from '@keyv/redis';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '@hdotu1/config';

export const KEYV_STORE = Symbol('KEYV_STORE');
export const KeyvStoreProvider = {
  provide: KEYV_STORE,
  useFactory: (configService: ConfigService) => {
    const { host, port } = configService.getOrThrow<AppConfig['redis']>('redis');

    return new Keyv({
      store: new KeyvRedis({
        //redis[s]://[[username][:password]@][host][:port][/db-number]
        url: `redis://${host}:${port}`,
      }),
      namespace: 'oidc'
    })
  },
  inject: [ConfigService]
} satisfies Provider<Keyv>;