import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';
import {
  adjectives,
  DEFAULT_PROFANITY,
  nouns,
  uniqueUsernameGenerator,
} from 'unique-username-generator';

import { TransactionService } from '@hdotu1/database-common';

import { UserEntity } from '../entities/user.entity.js';
import { UserRepository } from '../repositories/user.repository.js';

@Injectable()
export class UserService {
  constructor(
    private readonly tx: TransactionService,
    private readonly userRepository: UserRepository,
  ) {}

  private generateUsername() {
    return uniqueUsernameGenerator({
      dictionaries: [adjectives, nouns],
      profanityList: DEFAULT_PROFANITY,
      randomDigits: 3,
    });
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

  async createUserWithRandomUsername(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const username = this.generateUsername();
        const result = await userRepository
          .createQueryBuilder()
          .insert()
          .into(UserEntity)
          .values({
            email,
            username,
          })
          .orUpdate([], ['username'])
          .returning('*')
          .execute();

        if (result.identifiers.length > 0) {
          return userRepository.merge(userRepository.create(), result.generatedMaps[0])
        }
      }
    });
  }

  async createUserFromExternalUserInfo(email: string, em?: EntityManager) {
    return await this.createUserWithRandomUsername(email, em);
  }

  async createOrFindUserWithRandomUsername(email: string, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(this.userRepository);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const username = this.generateUsername();
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
      }
    });
  }
}
