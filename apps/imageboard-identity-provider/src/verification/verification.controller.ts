import {
  Body,
  Controller,
  GoneException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ErrorCode } from '../common/errors/error-code.js';
import {
  EMAIL_VERIFICATION_THROTTLE,
  VERIFICATION_COMPLETE_THROTTLE,
} from '../config/throttler.config.js';
import { VerificationDto } from '../interaction/dto/verification.dto.js';
import { VerificationCompleteDto } from '../interaction/dto/verification-complete.dto.js';
import { InvalidOtpError } from './errors/invalid-otp-error.js';
import { VerificationService } from './verification.service.js';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService
  ) {}

  @Throttle(EMAIL_VERIFICATION_THROTTLE)
  @Post()
  async emailVerification(@Body() body: VerificationDto) {
    return await this.verificationService.requestVerification(body.userId, 'email-verification');
  }

  @Throttle(VERIFICATION_COMPLETE_THROTTLE)
  @Post('complete')
  async completeEmailVerification(@Body() body: VerificationCompleteDto) {
    try {
      const verified = await this.verificationService.completeVerification(
        body.sessionId,
        body.otp,
        'email-verification',
      );

      return { verified };
    } catch (error: unknown) {
      if (error instanceof InvalidOtpError) {
        throw new GoneException({
          statusCode: HttpStatus.GONE,
          message: error.message,
          errorCode: ErrorCode.InvalidVerificationOTP,
        });
      }
      throw error;
    }
  }
}
