import crypto from 'node:crypto';
import type { Keyv } from '@keyv/redis';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

import type { VerificationSession } from '../common/interfaces.js';
import { KEYV_STORE } from '../keyv-store/keyv-store.provider.js';

const OTP_LENGTH = 6;

@Injectable()
export class VerificationService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(KEYV_STORE)
    private readonly keyv: Keyv,
  ) {}

  private getUserKey(id: string) {
    return `verify:user:${id}`;
  }

  private getSessionKey(id: string) {
    return `verify:session:${id}`;
  }

  private createOTP() {
    const digits = '0123456789';
    let otp = '';

    const randomValues = new Uint32Array(OTP_LENGTH);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[randomValues[i] % 10];
    }
    return otp;
  }

  private async createVerificationSession(
    userId: string,
    purpose: VerificationSession['purpose'],
  ) {
    const ttl = this.configService.getOrThrow<number>('verificationSessionTTL');
    const resendCooldown = this.configService.getOrThrow<number>(
      'verificationResendCooldown',
    );
    const rounds = this.configService.getOrThrow<number>(
      'verificationOTPSaltRounds',
    );
    let sessionId = await this.keyv.get<string>(this.getUserKey(userId));
    const existingSession = sessionId
      ? await this.keyv.get<VerificationSession>(this.getSessionKey(sessionId))
      : undefined;

    if (sessionId && existingSession?.purpose === purpose) {
      const resendAvailableAt = existingSession.createdAt + resendCooldown;

      // Resent too soon: keep the existing (already emailed) OTP session alive
      // instead of burning a new one, so the client's countdown stays in sync.
      if (Date.now() < resendAvailableAt) {
        return {
          otp: null,
          session: existingSession,
          sessionId,
          resendAvailableAt,
          resent: false,
        };
      }
    }

    if (sessionId && existingSession) {
      // Delete old session if exists
      await this.keyv.delete(this.getSessionKey(sessionId));
    }

    sessionId = crypto.randomBytes(32).toString('base64url');
    const otp = this.createOTP();
    const otpHash = await bcrypt.hash(otp, rounds);
    const session = {
      purpose,
      userId,
      otpHash,
      ttl,
      createdAt: Date.now(),
    } satisfies VerificationSession;

    await this.keyv.set<VerificationSession>(
      this.getSessionKey(sessionId),
      session,
      ttl,
    );
    await this.keyv.set(this.getUserKey(userId), sessionId, ttl);
    return {
      otp,
      session,
      sessionId,
      resendAvailableAt: session.createdAt + resendCooldown,
      resent: true,
    };
  }

  private async getSessionById(sessionId: string) {
    const session = await this.keyv.get<VerificationSession>(this.getSessionKey(sessionId));
    return session ?? null;
  }

  private async deleteSession(sessionId: string) {
    const session = await this.keyv.get<VerificationSession>(this.getSessionKey(sessionId));
    if (session) {
      await this.keyv.delete(this.getUserKey(session.userId));
      await this.keyv.delete(this.getSessionKey(sessionId));
    }
  }

  async createEmailVerificationSession(userId: string) {
    return await this.createVerificationSession(
      userId,
      'email-verification',
    );
  }

  async consumeOTPSession(sessionId: string, otp: string, purpose: VerificationSession['purpose']) {
    const session = await this.getSessionById(sessionId);

    if (session?.purpose !== purpose) {
      throw new Error('Invalid OTP');
    }

    const otpMatch = await bcrypt.compare(otp, session.otpHash);

    if (!otpMatch) {
      throw new Error('Invalid OTP');
    }

    await this.deleteSession(sessionId);
    return session;
  }
}
