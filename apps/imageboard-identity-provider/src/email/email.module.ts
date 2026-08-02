import { Module } from '@nestjs/common';

import { EmailService } from './email.service.js';

@Module({
  imports: [],
  controllers: [],
  providers: [
    EmailService
  ],
  exports: [
    EmailService
  ]
})
export class EmailModule {}