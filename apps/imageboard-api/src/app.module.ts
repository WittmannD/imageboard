import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PublicationsModule } from './art/publications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HttpErrorFilter } from './common/filters/http-error.filter.js';
import configuration from './config/configuration.js';
import throttlerConfig from './config/throttler.config.js';
import { FederatedCredentialsModule } from './federated-credentials/federated-credentials.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration, throttlerConfig],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('throttler'),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.getOrThrow<DataSourceOptions>('dataSource'),
        autoLoadEntities: true,
      }),
    }),
    PublicationsModule,
    UserModule,
    AuthModule,
    FederatedCredentialsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    AppService,
  ],
})
export class AppModule {}
