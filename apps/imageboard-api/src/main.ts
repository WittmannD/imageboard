import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { config as rxjsConfig } from 'rxjs';

import { getConfig } from '@hdotu1/config';

import { AppModule } from './app.module.js';

function formatError(error: unknown) {
  return error instanceof Error ? error.stack : String(error);
}

// Safety nets for fire-and-forget work nobody awaits. By default RxJS
// rethrows a subscription's unhandled error asynchronously and Node exits on
// unhandled rejections; both failures are local to their own work, so log
// them and keep serving. A true uncaughtException still exits, as the
// process state can't be trusted after one.
rxjsConfig.onUnhandledError = (error) => {
  Logger.error(formatError(error), 'UnhandledObservableError');
};
process.on('unhandledRejection', (reason) => {
  Logger.error(formatError(reason), 'UnhandledRejection');
});

async function bootstrap(): Promise<string> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  await app.listen(getConfig().api.port, '0.0.0.0');

  return app.getUrl();
}

try {
  const url = await bootstrap();
  Logger.log(url, 'Bootstrap');
} catch (error) {
  Logger.error(error, 'Bootstrap');
  process.exitCode = 1;
}
