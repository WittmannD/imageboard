import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JobQueue } from './job-queue.js';

export const JobQueueProvider: Provider<JobQueue> = {
  provide: JobQueue,
  useFactory: (configService: ConfigService) =>
    new JobQueue(
      configService.getOrThrow<number>('videoProcessor.concurrency'),
    ),
  inject: [ConfigService],
};
