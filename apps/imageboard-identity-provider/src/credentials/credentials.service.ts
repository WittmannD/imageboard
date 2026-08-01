import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import type { TransactionService } from '../common/services/transaction.service.js';
import type { CredentialsRepository } from './credentials.repository.js';
import type { UserEntity } from '../user/user.entity.js';
import bcrypt from 'bcrypt';
import type { ConfigService } from '@nestjs/config';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly tx: TransactionService,
    private readonly configService: ConfigService,
  ) {}

  async findOneUserId(userId: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);
      return await credentialsRepository.findOneBy({ userId });
    })
  }

  async getUserCredentialsByPassword(userId: string, password: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentials = await this.findOneUserId(userId, entityManager);

      if (credentials?.compare(password)) {
        return null;
      }

      return credentials;
    })
  }

  async createForUser(user: UserEntity, password: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);

      const saltRounds = this.configService.getOrThrow<number>('pwHashSaltRounds');
      const passwordHash = await bcrypt.hash(password, saltRounds)
      const credentials = credentialsRepository.create({
        user,
        passwordHash
      });

      return await credentialsRepository.save(credentials);
    })
  }
}