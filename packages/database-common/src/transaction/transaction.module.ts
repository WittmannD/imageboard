import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionService } from './transaction.service.js';

@Module({
  imports: [TypeOrmModule],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
