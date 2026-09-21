import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type { CreateUser } from '../common/interfaces.js';
import type { UserEntity } from './user.entity.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly tx: TransactionService,
    private readonly userRepository: UserRepository,
  ) {}

  async findOneByEmail(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);
      return await userRepository.findOneBy({ email });
    });
  }

  async findOneById(id: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);
      return await userRepository.findOneBy({ id });
    });
  }

  async markEmailVerified(userId: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);
      const result = await userRepository.update(
        { id: userId },
        { emailVerified: true },
      );
      return Boolean(result.affected);
    });
  }

  /**
   * A completed reset proves the person controls the mailbox, so it also
   * verifies the email, and starts a new epoch for the account's logins.
   */
  async markPasswordReset(userId: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);
      const result = await userRepository.update(
        { id: userId },
        { emailVerified: true, passwordChangedAt: new Date() },
      );
      return Boolean(result.affected);
    });
  }

  async create(data: CreateUser, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      const user = userRepository.create({
        email: data.email,
        username: data.username,
      });
      return await userRepository.save(user);
    });
  }

  async deleteById(id: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);
      const result = await userRepository.delete({ id });
      return Boolean(result.affected);
    });
  }

  generateId(): UserEntity['id'] {
    return crypto.randomUUID();
  }
}
