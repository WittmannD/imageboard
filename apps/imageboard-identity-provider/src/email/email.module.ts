import { Module } from "@nestjs/common";

import { EmailService } from './email.service.js';

@Module({
  imports: [],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}
