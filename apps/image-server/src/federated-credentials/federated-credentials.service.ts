import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type { UserEntity } from '../user/entities/user.entity.js';
import { FederatedCredentialsEntity, ISSUER_SUBJECT_UNIQUE_CONSTRAINT } from './entities/federated-credentials.entity.js';
import { FederatedCredentialsRepository } from './repositories/federated-credentials.repository.js';

@Injectable()
export class FederatedCredentialsService {
  constructor(
    private readonly tx: TransactionService,
    private readonly federatedCredentialRepository: FederatedCredentialsRepository,
  ) {}

  async findOneByIssuerAndSubject(
    issuer: string,
    subject: string,
    em?: EntityManager,
  ) {
    return this.tx.withManager(em, async (entityManager) => {
      const federatedCredentialRepository = entityManager.withRepository(
        this.federatedCredentialRepository,
      );
      return await federatedCredentialRepository.findOneBy({ issuer, subject });
    });
  }

  async createForUser(
    user: UserEntity,
    issuer: string,
    subject: string,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const federatedCredentialRepository = entityManager.withRepository(
        this.federatedCredentialRepository,
      );
      const credentials = federatedCredentialRepository.create({
        user,
        issuer,
        subject,
        userId: user.id,
      });

      return await federatedCredentialRepository.save(credentials);
    });
  }

  async createOrFindForUser(
    user: UserEntity,
    issuer: string,
    subject: string,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const federatedCredentialRepository = entityManager.withRepository(
        this.federatedCredentialRepository,
      );

      const result = await federatedCredentialRepository
        .createQueryBuilder()
        .insert()
        .into(FederatedCredentialsEntity)
        .values({
          issuer,
          subject,
          userId: user.id,
        })
        .orUpdate([], [ISSUER_SUBJECT_UNIQUE_CONSTRAINT])
        .returning('*')
        .execute();

      if (result.identifiers.length > 0) {
        return federatedCredentialRepository.merge(
          federatedCredentialRepository.create(),
          result.generatedMaps[0],
          { user }
        );
      }

      return await federatedCredentialRepository.findOneByOrFail({ issuer, subject });
    });
  }
}
