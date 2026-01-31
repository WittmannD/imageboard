import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import {Transport, type AsyncMicroserviceOptions} from '@nestjs/microservices';
import {ConfigService} from "@nestjs/config";

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.REDIS,
        options: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        }
      }),
      inject: [ConfigService]
    },
  );
  await app.listen();
}

try {
  await bootstrap();
} catch (error) {
  Logger.log(error, 'Bootstrap')
}