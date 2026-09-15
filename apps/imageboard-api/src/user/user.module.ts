import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionModule } from '@hdotu1/database-common';
import { ImageProcessorClientModule } from '@hdotu1/image-processor-client';

import { AuthModule } from '../auth/auth.module.js';
import { UploadsModuleFactory } from '../multer/uploads-module-factory.js';
import { UserEntity } from './entities/user.entity.js';
import { UserRepositoryProvider } from './repositories/user.repository.js';
import { AvatarService } from './service/avatar.service.js';
import { UserService } from './service/user.service.js';
import { UserController } from './user.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TransactionModule,
    UploadsModuleFactory(),
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
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [
    UserRepositoryProvider,
    UserService,
    AvatarService
  ],
  exports: [
    UserService
  ]
})
export class UserModule {}
