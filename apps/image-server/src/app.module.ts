import {Module} from '@nestjs/common';

import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {ConfigModule, ConfigService} from "@nestjs/config";
import { ArtModule } from './art/art.module.js';
import {MulterModule} from "@nestjs/platform-express";
import {diskStorage} from "multer";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MulterModule.registerAsync({
      imports: [ConfigModule],
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
