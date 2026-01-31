import {Module} from '@nestjs/common';

import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {ConfigModule, ConfigService} from "@nestjs/config";
import { ArtModule } from './art/art.module.js';
import {MulterModule} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {ImageProcessorClientModule} from "@hdotu1/image-processor-client";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ImageProcessorClientModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT')
        }
      }),
      inject: [ConfigService]
    }),
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('uploads.destination')
        })
      }),
      inject: [ConfigService]
    }),
    ArtModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
