import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createRemoteJWKSet, jwtVerify, type RemoteJWKSet } from 'jose';
import * as oidcClient from 'openid-client';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type {
  UnvalidatedOidcClaims,
} from '../common/types/oidc.js';
import { FederatedCredentialsService } from '../federated-credentials/federated-credentials.service.js';
import type { UserEntity } from '../user/entities/user.entity.js';
import { UserService } from '../user/service/user.service.js';
import { AccessTokenPayloadModel } from './access-token-payload.model.js';
import {
  AuthServiceJWKSError,
  AuthServiceError,
  InvalidAccessToken,
} from './errors/auth-service-error.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly requiredClaims = [
    'iss',
    'aud',
    'sub',
    'email',
    'email_verified',
    'preferred_username',
  ];
  private readonly issuer: string;
  private readonly issuerUrl: string;
  private readonly audience: string;
  private jwks: RemoteJWKSet | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly federatedCredentialService: FederatedCredentialsService,
    private readonly tx: TransactionService,
  ) {
    this.issuer = this.configService.getOrThrow<string>('OIDC_ISSUER');
    this.issuerUrl = this.configService.getOrThrow<string>('OIDC_ISSUER_URL');
    this.audience = this.configService.getOrThrow<string>('BASE_URL');
  }

  private getJwks(): RemoteJWKSet {
    if (!this.jwks) {
      throw new AuthServiceJWKSError('Failed to create JWKS set');
    }

    return this.jwks;
  }

  private async verifyAccessToken(
    token: string,
  ): Promise<AccessTokenPayloadModel> {
    const { payload } = await jwtVerify<UnvalidatedOidcClaims>(
      token,
      this.getJwks(),
      {
        issuer: this.issuer,
        audience: this.audience,
        requiredClaims: this.requiredClaims,
      },
    );

    return this.validateClaims(payload);
  }

  async onModuleInit() {
    const config = await oidcClient.discovery(
      new URL(this.issuerUrl),
      this.configService.getOrThrow<string>('OIDC_CLIENT_ID'),
      {},
      () => {
        /* empty */
      },
      {
        // todo: remove in prod
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        execute: [oidcClient.allowInsecureRequests],
      },
    );
    const jwksUri = config.serverMetadata().jwks_uri;

    if (!jwksUri) {
      throw new AuthServiceJWKSError(
        'JWKS URI not found in OpenID configuration',
      );
    }

    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async validateAccessToken(
    token: string,
    em?: EntityManager,
  ): Promise<UserEntity | null> {
    const payload = await this.verifyAccessToken(token);

    const existingUser = await this.findUserByFederatedCredential(
      payload.sub,
      em,
    );
    if (existingUser) {
      return existingUser;
    }

    return await this.createWithFederatedCredentialOrFindUser(payload, em);
  }

  private async createWithFederatedCredentialOrFindUser(
    payload: AccessTokenPayloadModel,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const user = await this.userService.createWithUsernameOrFindUser(
        payload.preferred_username,
        payload.email,
        entityManager,
      );

      const credentials =
        await this.federatedCredentialService.createOrFindForUser(
          user,
          this.issuer,
          payload.sub,
          entityManager,
        );

      if (credentials.userId !== user.id) {
        const credentialUser = await this.userService.findOneById(
          credentials.userId,
          entityManager,
        );

        if (!credentialUser) {
          throw new AuthServiceError(
            'Federated credential points to a missing user',
          );
        }

        return credentialUser;
      }

      return user;
    });
  }

  private async findUserByFederatedCredential(
    subject: string,
    em?: EntityManager,
  ) {
    return this.tx.withManager(em, async (entityManager) => {
      const credentials =
        await this.federatedCredentialService.findOneByIssuerAndSubject(
          this.issuer,
          subject,
          entityManager,
        );

      if (!credentials) {
        return null;
      }

      const user = await this.userService.findOneById(
        credentials.userId,
        entityManager,
      );

      if (!user) {
        throw new AuthServiceError(
          'Federated credential points to a missing user',
        );
      }

      return user;
    });
  }

  private async validateClaims(
    unvalidated: unknown,
  ): Promise<AccessTokenPayloadModel> {
    const claims = plainToInstance(AccessTokenPayloadModel, unvalidated ?? {});
    const errors = await validate(claims, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length && errors[0]) {
      Logger.warn('Invalid Access Token payload: ' + errors[0].toString());
      throw new InvalidAccessToken();
    }

    return claims;
  }
}
