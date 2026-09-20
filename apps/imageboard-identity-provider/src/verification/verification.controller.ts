import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import {
  EMAIL_VERIFICATION_THROTTLE,
  VERIFICATION_COMPLETE_THROTTLE,
} from '../config/throttler.config.js';
import { EmailService } from '../email/email.service.js';
import { accountVerificationEmail } from '../email/email-templates.js';
import { VerificationDto } from '../interaction/dto/verification.dto.js';
import { VerificationCompleteDto } from '../interaction/dto/verification-complete.dto.js';
import { UserService } from '../user/user.service.js';
import { VerificationService } from './verification.service.js';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly userService: UserService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
  ) {}

  @Throttle(EMAIL_VERIFICATION_THROTTLE)
  @Post()
  async emailVerification(@Body() body: VerificationDto) {
    const user = await this.userService.findOneById(body.userId);
    const { otp, session, sessionId, resendAvailableAt, resent } =
      await this.verificationService.createEmailVerificationSession(
        // Continue with fake user ID to disallow guessing existing emails.
        user?.id ?? 'untrusted-' + this.userService.generateId(),
      );

    if (user && !user.emailVerified && resent) {
      void this.emailService
        .sendFromTemplate(
          accountVerificationEmail,
          {
            expiresIn: `${Math.round(session.ttl / 1000 / 60)} minutes`,
            otp,
          },
          { subject: 'Verify your account', to: user.email },
        )
        .then();
    } else {
      // If the user exists and email is verified, or the resend cooldown is
      // still active, silently proceed without sending another email.
      // TODO: notify the user, that someone is trying to register with their email
    }

    return { sessionId, resendAvailableAt };
  }

  @Throttle(VERIFICATION_COMPLETE_THROTTLE)
  @Post('complete')
  async completeEmailVerification(@Body() body: VerificationCompleteDto) {
    try {
      const deletedSession = await this.verificationService.consumeOTPSession(
        body.sessionId,
        body.otp,
        'email-verification',
      );

      const verified = await this.userService.markEmailVerified(
        deletedSession.userId,
      );
      return { verified };
    } catch (_error: unknown) {
      throw new BadRequestException('Invalid OTP or Session ID');
    }
  }
}
