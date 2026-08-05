import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TransactionService } from './transaction.service.js';

@Module({
  imports: [DataSource],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
