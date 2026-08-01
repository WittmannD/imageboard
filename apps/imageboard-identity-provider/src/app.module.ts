import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfig } from './app.config.js';
import { CommonModule } from './common/common.module.js';
import { OidcModule } from './oidc/oidc.module.js';
import { CredentialsModule } from './credentials/credentials.module.js';
import { UserModule } from './user/user.module.js';
import { InteractionModule } from './interaction/interaction.module.js';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig],
      envFilePath: './.env',
    }),
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
    }
  ],
})
export class AppModule {}
