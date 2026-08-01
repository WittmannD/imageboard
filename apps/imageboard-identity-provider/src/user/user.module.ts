import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './user.entity.js';
import { UserRepositoryProvider } from './user.repository.js';
import { UserService } from './user.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity])
  ],
  controllers: [],
  providers: [
    UserRepositoryProvider,
    UserService
  ],
  exports: [
    UserService
  ]
})
export class UserModule {}