import { Module } from '@nestjs/common';

import { TransactionModule } from '@hdotu1/database-common';

import { CredentialsModule } from '../credentials/credentials.module.js';
import { EmailModule } from '../email/email.module.js';
import { OidcModule } from '../oidc/oidc.module.js';
import { UserModule } from '../user/user.module.js';
import { InteractionController } from './interaction.contoller.js';
import { InteractionService } from './interaction.service.js';

@Module({
  imports: [
    OidcModule,
    CredentialsModule,
    EmailModule,
    UserModule,
    TransactionModule,
  ],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}
