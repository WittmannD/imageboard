import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { getCors } from './common/helpers/cors.js';

async function bootstrap(): Promise<string> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors(getCors());

  // trust nginx
  app.set('trust proxy', 1);

  await app.listen(process.env['PORT'] ?? 3000, '0.0.0.0');

  return app.getUrl();
}

try {
  const url = await bootstrap();
  Logger.log(url, 'Bootstrap');
} catch (error) {
  Logger.error(error, 'Bootstrap');
}
