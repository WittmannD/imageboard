import { Module } from '@nestjs/common';

import { TransactionModule } from '@hdotu1/database-common';

import { CredentialsModule } from '../credentials/credentials.module.js';
import { EmailModule } from '../email/email.module.js';
import { UserModule } from '../user/user.module.js';
import { PasswordResetController } from './password-reset.controller.js';
import { PasswordResetService } from './password-reset.service.js';

@Module({
  imports: [TransactionModule, EmailModule, UserModule, CredentialsModule],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
