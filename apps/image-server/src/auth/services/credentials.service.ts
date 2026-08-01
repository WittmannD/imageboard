import { Injectable } from '@nestjs/common';
import type { ExternalProfile } from '../types.js';
import { TransactionService } from '../../common/services/transaction.service.js';
import { CredentialsRepository } from '../repositories/credentials.repository.js';
import { UserService } from '../../user/service/user.service.js';
import type { EntityManager } from 'typeorm';
import type { UserEntity } from '../../user/entities/user.entity.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly tx: TransactionService,
    private readonly credentialsRepository: CredentialsRepository,
    private readonly userService: UserService
  ) {}

  private async createAndLinkCredentials(issuer: string, subject: string, user: UserEntity, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);

      let credentials = credentialsRepository.create({
        user,
        issuer,
        subject,
      });
      credentials = await credentialsRepository.save(credentials);
      return credentials;
    })
  }

  async getOrCreateCredentials(issuer: string, subject: string, profile: ExternalProfile, em?: EntityManager) {
    return await this.tx.withManager(em, async (entityManager) => {
      const credentialsRepository = entityManager.withRepository(this.credentialsRepository);

      let userCredentials = await credentialsRepository.findOne({
        where: {
          issuer,
          subject,
        },
        relations: {
          user: true,
        },
      });

      if (userCredentials) {
        return userCredentials;
      }

      // No credentials for current login method

      const existingUser = await this.userService.findOneByEmail(profile.email, entityManager);

      if (!existingUser) {
        // First time we've ever seen this email
        const user = await this.userService.createUserFromExternalProfile(profile, entityManager);
        userCredentials = await this.createAndLinkCredentials(issuer, subject, user, entityManager);
        return userCredentials;
      }

      // User already exists, but used different login method. Link new credentials
      userCredentials = await this.createAndLinkCredentials(issuer, subject, existingUser, entityManager);
      return userCredentials;
    })
  }
}