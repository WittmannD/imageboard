import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module.js';
import { UserModule } from '../user/user.module.js';
import { VerificationService } from './verification.service.js';
import { VerificationController } from './verification.controller.js';
import { TransactionModule } from '@hdotu1/database-common';

@Module({
  imports: [
    TransactionModule,
    EmailModule,
    UserModule
  ],
  controllers: [
    VerificationController
  ],
  providers: [
    VerificationService
  ],
  exports: [
    VerificationService
  ],
})
export class VerificationModule {}
