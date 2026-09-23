import {
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '@hdotu1/config';

import { AppController } from './app.controller.js';
import configuration from './config/configuration.js';
import throttlerConfig from './config/throttler.config.js';
import { CredentialsModule } from './credentials/credentials.module.js';
import { InteractionModule } from './interaction/interaction.module.js';
import { KeyvStoreModule } from './keyv-store/keyv-store.module.js';
import { OidcModule } from './oidc/oidc.module.js';
import { PasswordResetModule } from './password-reset/password-reset.module.js';
import { UserModule } from './user/user.module.js';
import { VerificationModule } from './verification/verification.module.js';

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
    // KeyvStoreModule is global module
    KeyvStoreModule,
    OidcModule,
    CredentialsModule,
    UserModule,
    InteractionModule,
    VerificationModule,
    PasswordResetModule,
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
          database: database.names.identity,
          dropSchema: database.dropSchema,
          autoLoadEntities: true,
          synchronize: database.synchronize,
          ssl: database.ssl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [
    AppController
  ]
})
export class AppModule {}
