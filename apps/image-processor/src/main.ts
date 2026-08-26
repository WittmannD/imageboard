import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { type AsyncMicroserviceOptions } from '@nestjs/microservices';

import { RedisTransportServer } from '@hdotu1/redis-transport';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        strategy: new RedisTransportServer({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        }),
      }),
      inject: [ConfigService],
    },
  );
  await app.listen();
}

try {
  await bootstrap();
} catch (error) {
  Logger.log(error, 'Bootstrap');
}
