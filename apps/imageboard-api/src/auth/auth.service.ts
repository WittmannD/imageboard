import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type RemoteJWKSet } from 'jose';
import * as oidcClient from 'openid-client';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type {
  OidcUserInfo,
  UnvalidatedOidcClaims,
} from '../common/types/oidc.js';
import { FederatedCredentialsService } from '../federated-credentials/federated-credentials.service.js';
import { UserService } from '../user/service/user.service.js';
import {
  EmailIsNotVerifiedError,
  MissingClaimsError,
} from './errors/auth-service-error.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly requiredClaims = ['sub', 'email', 'email_verified'];
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
    this.audience = new URL(
      this.configService.getOrThrow<string>('baseUrl'),
    ).origin;
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
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        execute: [oidcClient.allowInsecureRequests],
      },
    );
    const jwksUri = config.serverMetadata().jwks_uri;

    if (!jwksUri) {
      throw new Error('JWKS URI not found in OpenID configuration');
    }

    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async validateAccessToken(token: string, em?: EntityManager) {
    const userInfo = await this.verifyAccessToken(token);

    const existingUser = await this.findUserByFederatedCredential(
      userInfo.sub,
      em,
    );
    if (existingUser) {
      return existingUser;
    }

    return await this.createOrFindUserWithFederatedCredential(userInfo, em);
  }

  private async createOrFindUserWithFederatedCredential(
    userInfo: OidcUserInfo,
    em?: EntityManager,
  ) {
    return await this.tx.withManager(em, async (entityManager) => {
      const user = await this.userService.createOrFindUserWithRandomUsername(
        userInfo.email,
        entityManager,
      );

      const credentials =
        await this.federatedCredentialService.createOrFindForUser(
          user,
          this.issuer,
          userInfo.sub,
          entityManager,
        );

      if (credentials.userId !== user.id) {
        const credentialUser = await this.userService.findOneById(
          credentials.userId,
          entityManager,
        );

        if (!credentialUser) {
          throw new Error('Federated credential points to a missing user');
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
        throw new Error('Federated credential points to a missing user');
      }

      return user;
    });
  }

  private async verifyAccessToken(token: string): Promise<OidcUserInfo> {
    const { payload } = await jwtVerify<UnvalidatedOidcClaims>(
      token,
      this.getJwks(),
      {
        issuer: this.issuer,
        audience: this.audience,
      },
    );

    return this.validateUserInfo(payload);
  }

  private validateUserInfo(userInfo: UnvalidatedOidcClaims): OidcUserInfo {
    const missingClaims = this.requiredClaims.filter(
      (claim) => !(claim in userInfo),
    );

    if (missingClaims.length > 0) {
      throw new MissingClaimsError(
        'Missing required claims: ' + missingClaims.join(','),
      );
    }

    if (typeof userInfo.sub !== 'string' || userInfo.sub.trim().length === 0) {
      throw new MissingClaimsError('sub is missing from the user info');
    }

    if (
      typeof userInfo.email !== 'string' ||
      userInfo.email.trim().length === 0
    ) {
      throw new MissingClaimsError('email is missing from the user info');
    }

    if (typeof userInfo.email_verified !== 'boolean') {
      throw new MissingClaimsError(
        'email_verified is missing from the user info',
      );
    }

    if (!userInfo.email_verified) {
      throw new EmailIsNotVerifiedError('User email is not verified');
    }

    return userInfo as OidcUserInfo;
  }

  private getJwks(): RemoteJWKSet {
    if (!this.jwks) {
      throw new Error('Failed to create JWKS set');
    }

    return this.jwks;
  }
}
