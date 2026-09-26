import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';

import { isUniqueViolation, TransactionService } from '@hdotu1/database-common';

import { UserEntity } from '../entities/user.entity.js';
import {
  UsernameGenerationError,
  UsernameTakenError,
  UserNotFoundError,
} from '../errors/user-service-error.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UserStatsRepository } from '../repositories/user-stats.repository.js';

const USERNAME_CREATION_ATTEMPTS = 10;

@Injectable()
export class UserService {
  constructor(
    private readonly tx: TransactionService,
    private readonly userRepository: UserRepository,
    private readonly userStatsRepository: UserStatsRepository,
  ) {}

  private modifyPreferredUsername(prefix: string, suffixLength = 6) {
    const suffix = crypto
      .randomBytes(suffixLength)
      .toString('hex')
      .slice(0, suffixLength);
    return `${prefix}-${suffix}`;
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

  async getOneById(id: number, em?: EntityManager) {
    const user = await this.findOneById(id, em);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async getUserStatsByUserId(userId: number, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userStatsRepository = entityManager.withRepository(
        this.userStatsRepository,
      );

      const stats = await userStatsRepository.findOneBy({ userId });

      if (!stats) {
        throw new UserNotFoundError();
      }

      return stats;
    });
  }

  async updateUsername(user: UserEntity, username: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      try {
        user.username = username;
        return await userRepository.save(user);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new UsernameTakenError();
        }

        throw error;
      }
    });
  }

  async createWithUsernameOrFindUser(
    preferredUsername: string,
    email: string,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      let attempts = 0;
      let username = preferredUsername;
      const userRepository = entityManager.withRepository(this.userRepository);

      for (;;) {
        // email and username are separately unique, so no single ON CONFLICT
        // target covers both; skip the insert on either and tell them apart below
        const result = await userRepository
          .createQueryBuilder()
          .insert()
          .into(UserEntity)
          .values({
            email,
            username,
          })
          .orIgnore()
          .returning('*')
          .execute();

        // a skipped insert still yields one (null) identifier per value set
        if (result.identifiers.at(0)) {
          // Insertion succeed: return inserted user entity
          return userRepository.merge(
            userRepository.create(),
            result.generatedMaps[0],
          );
        }

        const user = await userRepository.findOneBy({ email });

        if (user) {
          // User exists, so the insertion attempt above failed due to email
          // uniqueness violation. Return existed user.
          return user;
        }

        // The insertion attempt above failed due to the username uniqueness
        // violation. Making the attempt to modify the preferred username by
        // adding a random chars suffix.
        if (++attempts > USERNAME_CREATION_ATTEMPTS) {
          throw new UsernameGenerationError();
        }

        username = this.modifyPreferredUsername(preferredUsername);
      }
    });
  }
}
