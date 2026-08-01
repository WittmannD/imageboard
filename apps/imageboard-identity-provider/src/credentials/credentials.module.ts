import { Module } from '@nestjs/common';

import { CredentialsRepositoryProvider } from './credentials.repository.js';
import { CredentialsService } from './credentials.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CredentialsEntity } from './credentials.entity.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CredentialsEntity]),
    CommonModule
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