import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import { UserEntity } from '../entities/user.entity.js';
import { UsernameTakenError } from '../errors/user-service-error.js';
import { UserRepository } from '../repositories/user.repository.js';

const USERNAME_CREATION_ATTEMPTS = 10;

@Injectable()
export class UserService {
  constructor(
    private readonly tx: TransactionService,
    private readonly userRepository: UserRepository,
  ) {}

  private generatePreferredUsername(prefix: string, suffixLength = 8) {
    const suffix = crypto
      .randomBytes(suffixLength)
      .toString('hex')
      .slice(0, suffixLength);
    return `${prefix}-${suffix}`
  }

  async findOneByEmail(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      return await userRepository.findOneBy({ email });
    });
  }

  async findOneById(id: number, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      return await userRepository.findOneBy({ id });
    });
  }

  async createWithUsernameOrFindUser(preferredUsername: string, email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      let attempts = 0;
      let username = preferredUsername;
      const userRepository = entityManager.withRepository(this.userRepository);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        // todo: check if this approach for handling unique violations actually works
        const result = await userRepository
          .createQueryBuilder()
          .insert()
          .into(UserEntity)
          .values({
            email,
            username,
          })
          .orUpdate([], ['email', 'username'])
          .returning('*')
          .execute();

        if (result.identifiers.length > 0) {
          return userRepository.merge(
            userRepository.create(),
            result.generatedMaps[0],
          );
        }

        const user = await userRepository.findOneBy({ email });

        if (user) {
          return user;
        }

        if ((++attempts) > USERNAME_CREATION_ATTEMPTS) {
          throw new UsernameTakenError();
        }

        // User entity insertion failed, try again with a different username
        username = this.generatePreferredUsername(preferredUsername);
      }
    });
  }
}
