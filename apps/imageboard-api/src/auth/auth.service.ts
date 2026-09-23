import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  createRemoteJWKSet,
  errors as joseErrors,
  jwtVerify,
  type RemoteJWKSet,
} from 'jose';
import * as oidcClient from 'openid-client';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';

import type {
  UnvalidatedOidcClaims,
} from '../common/types/oidc.js';
import { FederatedCredentialsService } from '../federated-credentials/federated-credentials.service.js';
import type { UserEntity } from '../user/entities/user.entity.js';
import { UserServiceError } from '../user/errors/user-service-error.js';
import { UserService } from '../user/service/user.service.js';
import { AccessTokenPayloadModel } from './access-token-payload.model.js';
import {
  AccessTokenExpiredError,
  AuthProviderUnavailableError,
  EmailNotVerifiedError,
  InvalidAccessTokenError,
  OrphanedFederatedCredentialError,
  UserProvisioningError,
} from './errors/auth-service-error.js';

// Only the email_verified check is tagged with VERIFIED_EMAIL_GROUP
function isOnlyEmailUnverified(errors: ValidationError[]) {
  return errors.every(
    (error) =>
      error.property === 'email_verified' &&
      Object.keys(error.constraints ?? {}).every((key) => key === 'equals'),
  );
}

// jose reports JWKS fetch failures (timeouts, non-200s, unparsable bodies) with
// these; every other JOSEError means the token itself is bad
function isJwksFetchError(error: unknown) {
  return (
    error instanceof joseErrors.JWKSTimeout ||
    error instanceof joseErrors.JWKSInvalid ||
    (error instanceof joseErrors.JOSEError &&
      error.code === joseErrors.JOSEError.code)
  );
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
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
  private jwksDiscovery: Promise<RemoteJWKSet> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly federatedCredentialService: FederatedCredentialsService,
    private readonly tx: TransactionService,
  ) {
    this.issuer = this.configService.getOrThrow<string>('urls.auth');
    this.issuerUrl = this.configService.getOrThrow<string>('urls.auth');
    this.audience = this.configService.getOrThrow<string>('urls.api');
  }

  private async discoverJwks(): Promise<RemoteJWKSet> {
    // outside the try: a missing config key is a bug, not an IdP outage
    const clientId = this.configService.getOrThrow<string>(
      'identityProvider.oidc.client.id',
    );
    let jwksUri: string | undefined;

    try {
      const config = await oidcClient.discovery(
        new URL(this.issuerUrl),
        clientId,
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
      jwksUri = config.serverMetadata().jwks_uri;
    } catch (error) {
      throw new AuthProviderUnavailableError(
        'OpenID configuration discovery failed',
        error,
      );
    }

    if (!jwksUri) {
      throw new AuthProviderUnavailableError(
        'JWKS URI not found in OpenID configuration',
      );
    }

    return createRemoteJWKSet(new URL(jwksUri));
  }

  // Retry on demand and share one in-flight attempt between concurrent requests
  private async getJwks(): Promise<RemoteJWKSet> {
    if (this.jwks) {
      return this.jwks;
    }

    this.jwksDiscovery ??= this.discoverJwks().finally(() => {
      this.jwksDiscovery = null;
    });
    this.jwks = await this.jwksDiscovery;

    return this.jwks;
  }

  private async verifyAccessToken(
    token: string,
    skipEmailVerification: boolean,
  ): Promise<AccessTokenPayloadModel> {
    const jwks = await this.getJwks();
    let payload: UnvalidatedOidcClaims;

    try {
      ({ payload } = await jwtVerify<UnvalidatedOidcClaims>(token, jwks, {
        issuer: this.issuer,
        audience: this.audience,
        requiredClaims: this.requiredClaims,
      }));
    } catch (error) {
      if (error instanceof joseErrors.JWTExpired) {
        throw new AccessTokenExpiredError(error);
      }

      if (isJwksFetchError(error)) {
        throw new AuthProviderUnavailableError('Failed to fetch JWKS', error);
      }

      if (error instanceof joseErrors.JOSEError) {
        throw new InvalidAccessTokenError(undefined, error);
      }

      // not jose's own error, e.g. fetch() failing to connect to the JWKS URI
      throw new AuthProviderUnavailableError(
        'Failed to verify access token',
        error,
      );
    }

    return this.validateClaims(payload, skipEmailVerification);
  }

  async onModuleInit() {
    try {
      await this.getJwks();
    } catch (error) {
      // Not fatal: public routes keep working and getJwks() retries later
      this.logger.warn(
        `JWKS discovery failed, retrying on the next authenticated request: ${String(error)}`,
      );
    }
  }

  async validateAccessToken(
    token: string,
    skipEmailVerification: boolean,
    em?: EntityManager,
  ): Promise<UserEntity | null> {
    const payload = await this.verifyAccessToken(token, skipEmailVerification);

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
      let user: UserEntity;

      try {
        user = await this.userService.createWithUsernameOrFindUser(
          payload.preferred_username,
          payload.email,
          entityManager,
        );
      } catch (error) {
        if (error instanceof UserServiceError) {
          throw new UserProvisioningError(error);
        }

        throw error;
      }

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
          throw new OrphanedFederatedCredentialError();
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
        throw new OrphanedFederatedCredentialError();
      }

      return user;
    });
  }

  private async validateClaims(
    unvalidated: unknown,
    skipEmailVerification: boolean,
  ): Promise<AccessTokenPayloadModel> {
    const claims = plainToInstance(AccessTokenPayloadModel, unvalidated ?? {});
    const errors = await validate(claims, {
      whitelist: true,
      forbidNonWhitelisted: false,
      // VERIFIED_EMAIL_GROUP tags only the "email must be verified" rule.
      // strictGroups + no groups excludes just that tagged constraint when
      // skipping is requested, and leaves every other field validated as usual.
      strictGroups: skipEmailVerification,
    });

    if (errors.length === 0) {
      return claims;
    }

    if (isOnlyEmailUnverified(errors)) {
      throw new EmailNotVerifiedError();
    }

    this.logger.warn(
      'Invalid Access Token payload: ' + errors.map(String).join('; '),
    );
    throw new InvalidAccessTokenError();
  }
}
