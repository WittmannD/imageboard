import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionModule } from '@hdotu1/database-common';

import { CredentialsEntity } from './credentials.entity.js';
import { CredentialsRepositoryProvider } from './credentials.repository.js';
import { CredentialsService } from './credentials.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialsEntity]), TransactionModule],
  controllers: [],
  providers: [CredentialsRepositoryProvider, CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
