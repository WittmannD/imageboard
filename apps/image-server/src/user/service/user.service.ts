import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';
import { adjectives, DEFAULT_PROFANITY, nouns, uniqueUsernameGenerator } from 'unique-username-generator';

import { isUniqueViolation } from '@hdotu1/database-common';

import type { ExternalProfile } from '../../auth/types.js';
import { TransactionService } from '../../common/services/transaction.service.js';
import { UserEntity } from '../entities/user.entity.js';
import { UserRepository } from '../repositories/user.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly tx: TransactionService,
    private readonly userRepository: UserRepository,
  ) {}

  private async insertRandomUsername(
    userDraft: UserEntity,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        userDraft.username = uniqueUsernameGenerator({
          dictionaries: [adjectives, nouns],
          profanityList: DEFAULT_PROFANITY,
          randomDigits: 0,
        });

        try {
          await userRepository.save(userDraft);
          return userDraft;
        } catch (error: unknown) {
          if (error instanceof Error && isUniqueViolation(error)) {
            continue;
          }

          throw error;
        }
      }
    });
  }

  async findOneByEmail(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      return await userRepository.findOneBy({ email });
    })
  }

  async createUser(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      let user = userRepository.create({
        username: '',
        email
      });

      user = await this.insertRandomUsername(user, entityManager);
      user = await userRepository.save(user);
      return user;
    });
  }

  async createUserFromExternalProfile(profile: ExternalProfile, em?: EntityManager) {
    return await this.createUser(profile.email, em);
  }
}
