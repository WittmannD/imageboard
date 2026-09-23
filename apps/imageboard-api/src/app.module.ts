import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '@hdotu1/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PublicationsModule } from './art/publications.module.js';
import { AuthModule } from './auth/auth.module.js';
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
      useFactory: (config: ConfigService) => {
        const database = config.getOrThrow<AppConfig['database']>('database');

        return {
          type: 'postgres',
          host: database.host,
          port: database.port,
          username: config.getOrThrow<string>('secrets.DB_USER'),
          password: config.getOrThrow<string>('secrets.DB_PASS'),
          database: database.names.api,
          dropSchema: database.dropSchema,
          autoLoadEntities: true,
          synchronize: database.synchronize,

          ssl: database.ssl ? { rejectUnauthorized: false } : false,
        };
      },
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
    AppService,
  ]
})
export class AppModule {}
