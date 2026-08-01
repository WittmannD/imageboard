import { Module } from "@nestjs/common";

import { OidcModule } from '../oidc/oidc.module.js';
import { InteractionController } from './interaction.contoller.js';

@Module({
  imports: [
    OidcModule
  ],
  controllers: [InteractionController],
  providers: [],
})
export class InteractionModule {}