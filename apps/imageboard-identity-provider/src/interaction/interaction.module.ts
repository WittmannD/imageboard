import { Module } from "@nestjs/common";

import { CredentialsModule } from '../credentials/credentials.module.js';
import { EmailModule } from '../email/email.module.js';
import { OidcModule } from '../oidc/oidc.module.js';
import { UserModule } from '../user/user.module.js';
import { InteractionController } from './interaction.contoller.js';
import { InteractionService } from './interaction.service.js';
import { VerificationService } from './verification.service.js';

@Module({
  imports: [OidcModule, CredentialsModule, EmailModule, UserModule],
  controllers: [InteractionController],
  providers: [InteractionService, VerificationService],
})
export class InteractionModule {}