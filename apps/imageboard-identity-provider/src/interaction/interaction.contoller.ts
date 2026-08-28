import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import IdProvider from 'oidc-provider';

import { CredentialsService } from '../credentials/credentials.service.js';
import { EmailService } from '../email/email.service.js';
import { accountVerificationEmail } from '../email/email-templates.js';
import { OIDC_PROVIDER } from '../oidc/oidc.provider.js';
import {
  EMAIL_VERIFICATION_THROTTLE,
  LOGIN_THROTTLE,
  REGISTRATION_THROTTLE,
  VERIFICATION_COMPLETE_THROTTLE,
} from '../config/throttler.config.js';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { RegistrationDto } from './dto/registration.dto.js';
import type { VerificationDto } from './dto/verification.dto.js';
import { VerificationCompleteDto } from './dto/verification-complete.dto.js';
import { InteractionService } from './interaction.service.js';
import { VerificationService } from './verification.service.js';

@Controller('interactions')
export class InteractionController {
  constructor(
    @Inject(OIDC_PROVIDER)
    private readonly oidc: IdProvider,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly credentialsService: CredentialsService,

    private readonly interactionService: InteractionService,
    private readonly verificationService: VerificationService,
    private readonly emailService: EmailService,
  ) {}

  @Get(':uid')
  async getInteractionDetails(@Req() req: Request, @Res() res: Response) {
    const interaction = await this.oidc.interactionDetails(req, res);
    const queryString = req.url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);

    params.append('uid', interaction.uid);

    res.redirect(
      new URL(
        `${interaction.prompt.name}?${params.toString()}`,
        this.configService.getOrThrow('INTERACTIONS_BASE_URL'),
      ).href,
    );
  }

  @Throttle(LOGIN_THROTTLE)
  @Post(':uid/login')
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: LoginDto,
  ): Promise<void> {
    const user = await this.userService.findOneByEmail(body.email);

    if (!user) {
      await this.oidc.interactionFinished(req, res, {
        error: 'access_denied',
        error_description: 'Invalid credentials',
      });
      return;
    }

    const credentials =
      await this.credentialsService.getUserCredentialsByPassword(
        user.id,
        body.password,
      );

    if (!credentials) {
      await this.oidc.interactionFinished(req, res, {
        error: 'access_denied',
        error_description: 'Invalid credentials',
      });
      return;
    }

    await this.oidc.interactionFinished(req, res, {
      login: {
        accountId: user.id,
        remember: true,
      },
    });
  }

  @Throttle(REGISTRATION_THROTTLE)
  @Post(':uid/registration')
  async registration(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RegistrationDto,
  ) {
    const user = await this.interactionService.registration(body);
    // If creating a new user fails due to email uniqueness violation,
    // proceed with a fake user ID to disallow guessing existing emails.
    // Later it will fail in the `findAccount` method, and the user will get a generic error

    const userId = user?.id ?? 'untrusted-' + this.userService.generateId();

    if (req.header('Content-Type') === 'application/json') {
      const redirectTo = await this.oidc.interactionResult(req, res, {
        login: {
          accountId: userId,
          remember: true,
        },
      });
      return { redirectTo };
    } else {
      // Finish with redirect
      await this.oidc.interactionFinished(req, res, {
        login: {
          accountId: userId,
          remember: true,
        },
      });
      return;
    }
  }

  @Throttle(EMAIL_VERIFICATION_THROTTLE)
  @Post('verification')
  async emailVerification(@Body() body: VerificationDto) {
    const user = await this.userService.findOneById(body.userId);
    const { otp, session, sessionId } =
      await this.verificationService.createEmailVerificationSession(
        // Continue with fake user ID to disallow guessing existing emails.
        user?.id ?? 'untrusted-' + this.userService.generateId(),
      );

    if (user && !user.emailVerified) {
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
      // If the user exists and email is verified, silently proceed
      // TODO: notify the user, that someone is trying to register with their email
    }

    return { sessionId };
  }

  @Throttle(VERIFICATION_COMPLETE_THROTTLE)
  @Post('verification/complete')
  async completeEmailVerification(@Body() body: VerificationCompleteDto) {
    const deletedSession =
      await this.verificationService.deleteSessionIfOtpMatch(
        body.sessionId,
        body.otp,
        'email-verification',
      );

    if (!deletedSession) {
      throw new BadRequestException('Invalid OTP or Session ID');
    }

    const verified = await this.userService.markEmailVerified(deletedSession.userId);
    return { verified };
  }
}
