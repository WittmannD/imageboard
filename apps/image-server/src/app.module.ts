import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PublicationsModule } from './art/publications.module.js';
import AppConfig from './config/app-config.js';
import { FederatedCredentialsModule } from './federated-credentials/federated-credentials.module.js';
import { UserModule } from './user/user.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig],
      envFilePath: './.env',
    }),
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
    AppService,
  ]
})
export class AppModule {}
