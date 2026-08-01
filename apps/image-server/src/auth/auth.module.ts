import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { CredentialsEntity } from './entities/credentials.entity.js';
import { CredentialsRepositoryProvider } from './repositories/credentials.repository.js';
import { CredentialsService } from './services/credentials.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialsEntity]),
    UserModule,
  ],
  providers: [
    CredentialsRepositoryProvider,
    CredentialsService,
  ],
  controllers: [AuthController],
  exports: [CredentialsService],
})
export class AuthModule {}
