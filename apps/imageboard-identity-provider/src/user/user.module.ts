import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionModule } from '@hdotu1/database-common';

import { UserEntity } from './user.entity.js';
import { UserRepositoryProvider } from './user.repository.js';
import { UserService } from './user.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), TransactionModule],
  controllers: [],
  providers: [UserRepositoryProvider, UserService],
  exports: [UserService],
})
export class UserModule {}
