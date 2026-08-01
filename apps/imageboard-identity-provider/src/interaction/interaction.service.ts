import { Inject, Injectable } from '@nestjs/common';
import { accountVerificationEmail } from '../email/email-templates.js';
import { EmailService } from '../email/email.service.js';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { KEYV_STORE } from '../keyv-store/keyv-store.provider.js';
import type { Keyv } from '@keyv/redis';
import type { UserService } from '../user/user.service.js';
import type { TransactionService } from '../common/services/transaction.service.js';
import type { EntityManager } from 'typeorm';
import type {
  AccountVerificationSession,
  CreateUser,
} from '../common/interfaces.js';
import type { UserEntity } from '../user/user.entity.js';

@Injectable()
export class InteractionService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @Inject(KEYV_STORE)
    private readonly keyv: Keyv,
    private readonly tx: TransactionService,
  ) {}

  private getVerificationKey(id: string) {
    return `verification:${id}`;
  }

  async beginAccountVerification(interactionUid: string, user: UserEntity) {
    const token = crypto.randomBytes(32).toString('base64url');
    await this.keyv.set(
      this.getVerificationKey(token),
      {
        interactionUid,
        userId: user.id,
      },
      this.configService.getOrThrow<number>('verificationTokenTtl'),
    );

    await this.emailService.sendFromTemplate(
      accountVerificationEmail,
      {
        verificationUrl: new URL(
          `/interactions/${interactionUid}/verification?token=${token}`,
          this.configService.getOrThrow<string>('ISSUER_URL'),
        ),
      },
      {
        to: user.email,
      },
    );
  }

  async registration(
    interactionUid: string,
    data: CreateUser,
    em?: EntityManager,
  ) {
    await this.tx.withManager(em, async (entityManager) => {
      let user = await this.userService.findOneByEmail(
        data.email,
        entityManager,
      );

      if (user?.emailVerified) {
        // User already exists and email is verified, silently quit
        // TODO: notify the user, that someone is trying to register with their email
        return;
      }

      if (!user) {
        user = await this.userService.create(data, entityManager);
        await this.userService.create(data, entityManager);
      }

      await this.beginAccountVerification(interactionUid, user);
    });
  }

  /**
   * Checks verification session by opaque token and marks user's email as verified.
   *
   * @return The verified user or `null` if verification failed
   */
  async accountVerification(
    interactionUid: string,
    token: string,
    em?: EntityManager,
  ): Promise<UserEntity | null> {
    return await this.tx.withManager(em, async (entityManager) => {
      const verificationSession =
        await this.keyv.get<AccountVerificationSession>(
          this.getVerificationKey(token),
        );

      if (verificationSession?.interactionUid !== interactionUid) {
        // Session was expired or interaction id don't match
        return null;
      }

      const wasUpdated = await this.userService.setEmailVerified(
        verificationSession.userId,
        entityManager,
      );
      await this.keyv.delete(this.getVerificationKey(token));

      if (!wasUpdated) {
        return null;
      }

      return this.userService.findOneById(
        verificationSession.userId,
        entityManager,
      );
    });
  }
}
