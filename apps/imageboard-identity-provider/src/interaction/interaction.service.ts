import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import {
  getUniqueViolationConstraint,
  isUniqueViolation,
  TransactionService,
} from '@hdotu1/database-common';

import type {
  CreateUser,
} from '../common/interfaces.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import { USERNAME_UNIQUE_CONSTRAINT } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { UsernameTakenError } from './errors/registration-error.js';

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
   * @throws {UsernameTakenError} if the username is already taken. Unlike
   * email, a username isn't sensitive, so this is safe to report back to the
   * caller instead of failing silently.
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
          if (getUniqueViolationConstraint(error) === USERNAME_UNIQUE_CONSTRAINT) {
            throw new UsernameTakenError();
          }
          return null;
        }
        throw error;
      }
    });
  }

  /**
   * Undoes `registration()` when the OIDC interaction that was meant to
   * consume its result fails to complete (e.g. the interaction session
   * store is unreachable) - otherwise the user (and their credentials)
   * would be left in the database with no way to ever finish signing up
   * with that email again.
   */
  async rollbackRegistration(userId: string) {
    await this.tx.withManager(undefined, async (entityManager) => {
      await this.credentialsService.deleteForUser(userId, entityManager);
      await this.userService.deleteById(userId, entityManager);
    });
  }
}
