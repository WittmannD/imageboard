import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '@hdotu1/config';
import { TransactionModule } from '@hdotu1/database-common';
import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';

import { AuthModule } from '../auth/auth.module.js';
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
    TransactionModule,
    TypeOrmModule.forFeature([PostEntity, PhotoEntity]),
    UploadsModuleFactory(),
    ImageProcessorClientModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.getOrThrow<AppConfig['redis']>('redis'),
      }),
      inject: [ConfigService],
    }),
    AuthModule
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
