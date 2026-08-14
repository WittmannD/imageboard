import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionModule } from '@hdotu1/database-common';

import { FederatedCredentialsEntity } from './entities/federated-credentials.entity.js';
import { FederatedCredentialsService } from './federated-credentials.service.js';
import { FederatedCredentialsRepositoryProvider } from './repositories/federated-credentials.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([FederatedCredentialsEntity]),
    TransactionModule,
  ],
  providers: [
    FederatedCredentialsService,
    FederatedCredentialsRepositoryProvider,
  ],
  exports: [
    FederatedCredentialsService,
  ]
})
export class FederatedCredentialsModule {}
