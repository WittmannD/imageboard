import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionModule } from '@hdotu1/database-common';

import { UserEntity } from './entities/user.entity.js';
import { UserRepositoryProvider } from './repositories/user.repository.js';
import { UserService } from './service/user.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TransactionModule
  ],
  providers: [
    UserRepositoryProvider,
    UserService
  ],
  exports: [
    UserService
  ]
})
export class UserModule {}