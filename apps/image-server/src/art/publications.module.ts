import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';

import { UploadsModuleFactory } from '../multer/uploads-module-factory.js';
import { PhotoEntity } from './entities/photo.entity.js';
import { PostEntity } from './entities/post.entity.js';
import { PostController } from './post.controller.js';
import { PostService } from './post.service.js';
import { GalleryLayoutEngineProvider } from './providers/gallery-layout-engine.provider.js';
import { PhotoRepositoryProvider } from './repositories/photo.repository.js';
import { PostRepositoryProvider } from './repositories/post.repository.js';
import { PhotoService } from './services/photo.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, PhotoEntity]),
    UploadsModuleFactory(),
    ImageProcessorClientModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          keyPrefix: 'pubsub:'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PostController],
  providers: [
    PostService,
    PhotoService,
    PostRepositoryProvider,
    PhotoRepositoryProvider,
    GalleryLayoutEngineProvider,
  ],
})
export class PublicationsModule {}
