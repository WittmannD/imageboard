import {
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfig } from './config/app.config.js';
import { CommonModule } from './common/common.module.js';
import { CredentialsModule } from './credentials/credentials.module.js';
import { InteractionModule } from './interaction/interaction.module.js';
import { KeyvStoreModule } from './keyv-store/keyv-store.module.js';
import { OidcModule } from './oidc/oidc.module.js';
import throttlerConfig from './config/throttler.config.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig, throttlerConfig],
      envFilePath: './.env',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('throttler'),
    }),
    // KeyvStoreModule is global module
    KeyvStoreModule,
    // CommonModule is global module
    CommonModule,
    OidcModule,
    CredentialsModule,
    UserModule,
    InteractionModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sslEnabled = config.get('DB_SSL') === 'true';

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get('DB_PORT')),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          dropSchema: true,
          autoLoadEntities: true,
          synchronize: true,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
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
  controllers: []
})
export class AppModule {}
