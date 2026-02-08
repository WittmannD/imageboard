import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';

import { PostController } from './post.controller.js';
import { PostService } from './post.service.js';

@Module({
  imports: [
    ImageProcessorClientModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PublicationsModule {}
