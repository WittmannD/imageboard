import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';

async function bootstrap(): Promise<string> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  await app.listen(3000);

  return app.getUrl();
}

try {
  const url = await bootstrap();
  Logger.log(url, 'Bootstrap');
} catch (error) {
  Logger.error(error, 'Bootstrap');
}
