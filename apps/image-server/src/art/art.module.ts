import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';

import { ArtController } from './art.controller.js';
import { ArtService } from './art.service.js';

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
  controllers: [ArtController],
  providers: [ArtService],
})
export class ArtModule {}
