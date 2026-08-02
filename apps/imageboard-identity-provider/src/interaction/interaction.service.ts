import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { isUniqueViolation } from '@hdotu1/database-common';

import type {
  CreateUser,
} from '../common/interfaces.js';
import { TransactionService } from '../common/services/transaction.service.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class InteractionService {
  constructor(
    private readonly userService: UserService,
    private readonly credentialsService: CredentialsService,
    private readonly tx: TransactionService,
  ) {}

  /**
   * Handles the user registration process, including checking for existing users,
   * creating a new user record, and setting up credentials for the user.
   *
   * @return  Returns the newly created user object if successful,
   * or `null` if a user with the given email already exists.
   */
  async registration(data: CreateUser, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      try {
        const user = await this.userService.create(data, entityManager);
        await this.credentialsService.createForUser(
          user,
          data.password,
          entityManager,
        );

        return user;
      } catch (error: unknown) {
        if (error instanceof Error && isUniqueViolation(error)) {
          return null;
        }
        throw error;
      }
    });
  }
}
