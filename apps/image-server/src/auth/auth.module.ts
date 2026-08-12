import { Module } from '@nestjs/common';

import { TransactionModule } from '@hdotu1/database-common';

import { FederatedCredentialsModule } from '../federated-credentials/federated-credentials.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    UserModule,
    TransactionModule,
    FederatedCredentialsModule
  ],
  controllers: [],
  providers: [
    AuthService
  ],
  exports: [
    AuthService
  ]
})
export class AuthModule {}