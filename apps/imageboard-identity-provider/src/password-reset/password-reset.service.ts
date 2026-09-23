import crypto from 'node:crypto';
import type { Keyv } from '@keyv/redis';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TransactionService } from '@hdotu1/database-common';

import { CredentialsService } from '../credentials/credentials.service.js';
import { EmailService } from '../email/email.service.js';
import {
  passwordChangedEmail,
  passwordResetEmail,
} from '../email/email-templates.js';
import { KEYV_STORE } from '../keyv-store/keyv-store.provider.js';
import { UserService } from '../user/user.service.js';
import { InvalidResetTokenError } from './errors/invalid-reset-token-error.js';

const TOKEN_BYTES = 32;

interface ResetTokenRecord {
  userId: string;
  createdAt: number;
}

interface UserTokenRecord {
  tokenHash: string;
  createdAt: number;
}

const hashToken = (token: string) =>
  // The token is 256 bits of randomness, so a fast hash is enough: there is
  // nothing to brute-force, the hash only keeps a leaked store from being
  // directly usable.
  crypto.createHash('sha256').update(token).digest('base64url');

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(KEYV_STORE)
    private readonly keyv: Keyv,
    private readonly tx: TransactionService,
    private readonly userService: UserService,
    private readonly credentialsService: CredentialsService,
    private readonly emailService: EmailService,
  ) {}

  private tokenKey(tokenHash: string) {
    return `pwreset:token:${tokenHash}`;
  }

  private userKey(userId: string) {
    return `pwreset:user:${userId}`;
  }

  /**
   * @returns the raw token, or `null` when the previous request for this user
   * is still inside the resend cooldown (its email is already on the way).
   */
  private async issueToken(userId: string): Promise<string | null> {
    const ttl = this.configService.getOrThrow<number>('identityProvider.passwordReset.tokenTtlMs');
    const cooldown = this.configService.getOrThrow<number>(
      'identityProvider.passwordReset.requestCooldownMs',
    );
    const previous = await this.keyv.get<UserTokenRecord>(this.userKey(userId));

    if (previous) {
      if (Date.now() < previous.createdAt + cooldown) {
        return null;
      }

      // A new request replaces the old link.
      await this.keyv.delete(this.tokenKey(previous.tokenHash));
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = hashToken(token);
    const createdAt = Date.now();

    await this.keyv.set<ResetTokenRecord>(
      this.tokenKey(tokenHash),
      { userId, createdAt },
      ttl,
    );
    await this.keyv.set<UserTokenRecord>(
      this.userKey(userId),
      { tokenHash, createdAt },
      ttl,
    );

    return token;
  }

  private async consumeToken(token: string): Promise<string> {
    const key = this.tokenKey(hashToken(token));
    const record = await this.keyv.get<ResetTokenRecord>(key);

    // `delete` reports whether it removed anything, so when the same link is
    // submitted twice at once only one of them gets to spend it.
    if (!record || !(await this.keyv.delete(key))) {
      throw new InvalidResetTokenError();
    }

    await this.keyv.delete(this.userKey(record.userId));

    return record.userId;
  }

  private sendEmail(
    template: string,
    variables: Record<string, unknown>,
    mailOptions: { subject: string; to: string },
  ): void {
    // Fire and forget so the response time doesn't reveal whether an email was sent
    this.emailService
      .sendFromTemplate(template, variables, mailOptions)
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to send "${mailOptions.subject}" email`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  /**
   * Never reveals whether the email belongs to an account: unknown addresses
   * go through the same store work with a decoy id and simply send nothing.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.userService.findOneByEmail(email);
    const token = await this.issueToken(
      user?.id ?? 'untrusted-' + this.userService.generateId(),
    );

    if (!user || !token) {
      return;
    }

    // The token rides in the fragment: it never reaches a server, a proxy log
    // or a Referer header, only the browser that opens the link.
    const link = new URL(
      'reset-password',
      this.configService.getOrThrow<string>('urls.interactions'),
    );
    link.hash = new URLSearchParams({ token }).toString();

    const ttl = this.configService.getOrThrow<number>('identityProvider.passwordReset.tokenTtlMs');

    this.sendEmail(
      passwordResetEmail,
      {
        link: link.href,
        expiresIn: `${Math.round(ttl / 1000 / 60)} minutes`,
      },
      { subject: 'Reset your password', to: user.email },
    );
  }

  /**
   * @throws {InvalidResetTokenError} when the token is unknown, expired or
   * already used. The token is spent before the password is written, so a
   * failure after that point means requesting a new link, never a replay.
   */
  async completeReset(token: string, password: string): Promise<void> {
    const userId = await this.consumeToken(token);
    const user = userId.startsWith('untrusted-')
      ? null
      : await this.userService.findOneById(userId);

    if (!user) {
      throw new InvalidResetTokenError();
    }

    await this.tx.withManager(undefined, async (entityManager) => {
      const updated = await this.credentialsService.updatePasswordForUser(
        user.id,
        password,
        entityManager,
      );

      if (!updated) {
        throw new Error(`User ${user.id} has no credentials to reset`);
      }

      await this.userService.markPasswordReset(user.id, entityManager);
    });

    this.sendEmail(
      passwordChangedEmail,
      {},
      { subject: 'Your password was changed', to: user.email },
    );
  }
}
