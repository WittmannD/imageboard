import {
  Body,
  Controller,
  GoneException,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ErrorCode } from '../common/errors/error-code.js';
import { ErrorCodeFilter } from '../common/filters/error-code.filter.js';
import {
  PASSWORD_RESET_COMPLETE_THROTTLE,
  PASSWORD_RESET_REQUEST_THROTTLE,
} from '../config/throttler.config.js';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { InvalidResetTokenError } from './errors/invalid-reset-token-error.js';
import { PasswordResetService } from './password-reset.service.js';

@Controller('password-reset')
@UseFilters(ErrorCodeFilter)
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Throttle(PASSWORD_RESET_REQUEST_THROTTLE)
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async request(@Body() body: RequestPasswordResetDto): Promise<void> {
    await this.passwordResetService.requestReset(body.email);
  }

  @Throttle(PASSWORD_RESET_COMPLETE_THROTTLE)
  @Post('complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(@Body() body: CompletePasswordResetDto): Promise<void> {
    try {
      await this.passwordResetService.completeReset(body.token, body.password);
    } catch (error: unknown) {
      if (error instanceof InvalidResetTokenError) {
        throw new GoneException({
          statusCode: HttpStatus.GONE,
          message: error.message,
          errorCode: ErrorCode.InvalidResetToken,
        });
      }
      throw error;
    }
  }
}
