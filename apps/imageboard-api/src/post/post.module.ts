import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '@hdotu1/config';
import { TransactionModule } from '@hdotu1/database-common';
import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';
import { VideoProcessorClientModule } from '@hdotu1/video-processor-client';

import { AuthModule } from '../auth/auth.module.js';
import { UploadsModuleFactory } from '../multer/uploads-module-factory.js';
import { LikeEntity } from './entities/like.entity.js';
import { MediaEntity } from './entities/media.entity.js';
import { PostEntity } from './entities/post.entity.js';
import { PostController } from './post.controller.js';
import { PostService } from './services/post.service.js';
import { GalleryLayoutEngineProvider } from './providers/gallery-layout-engine.provider.js';
import { LikeRepositoryProvider } from './repositories/like.repository.js';
import { MediaRepositoryProvider } from './repositories/media.repository.js';
import { PostRepositoryProvider } from './repositories/post.repository.js';
import { LikeService } from './services/like.service.js';
import { MediaService } from './services/media.service.js';

@Module({
  imports: [
    TransactionModule,
    TypeOrmModule.forFeature([PostEntity, MediaEntity, LikeEntity]),
    UploadsModuleFactory(),
    ImageProcessorClientModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.getOrThrow<AppConfig['redis']>('redis'),
      }),
      inject: [ConfigService],
    }),
    VideoProcessorClientModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.getOrThrow<AppConfig['redis']>('redis'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [PostController],
  providers: [
    PostService,
    MediaService,
    LikeService,
    PostRepositoryProvider,
    MediaRepositoryProvider,
    LikeRepositoryProvider,
    GalleryLayoutEngineProvider,
  ],
})
export class PostModule {}
