import { Module } from '@nestjs/common';

import { CredentialsRepositoryProvider } from './credentials.repository.js';
import { CredentialsService } from './credentials.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialsEntity } from './credentials.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialsEntity]),
  ],
  controllers: [],
  providers: [
    CredentialsRepositoryProvider,
    CredentialsService
  ],
  exports: [
    CredentialsService
  ]
})
export class CredentialsModule {}