import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './entities/user.entity.js';
import { UserRepositoryProvider } from './repositories/user.repository.js';
import { UserService } from './service/user.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity])
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