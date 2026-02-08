import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PublicationsModule } from './art/publications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('uploads.destination'),
        }),
      }),
      inject: [ConfigService],
    }),
    PublicationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    AppService,
  ],
})
export class AppModule {}
