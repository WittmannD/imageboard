import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { CredentialsRepository } from './credentials.repository.js';
import type { UserEntity } from '../user/user.entity.js';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from '@hdotu1/database-common';

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

      if (!(await credentials?.compare(password))) {
        return null;
      }

      return credentials;
    })
  }

  private async hashPassword(password: string) {
    const saltRounds = this.configService.getOrThrow<number>('pwHashSaltRounds');
    return await bcrypt.hash(password, saltRounds)
  }

  async createForUser(user: UserEntity, password: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);

      const credentials = credentialsRepository.create({
        user,
        passwordHash: await this.hashPassword(password)
      });

      return await credentialsRepository.save(credentials);
    })
  }

  async updatePasswordForUser(userId: string, password: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);
      const result = await credentialsRepository.update(
        { userId },
        { passwordHash: await this.hashPassword(password) },
      );

      return Boolean(result.affected);
    })
  }

  async deleteForUser(userId: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);
      await credentialsRepository.delete({ userId });
    })
  }
}