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

import {
  LOGIN_THROTTLE,
  REGISTRATION_THROTTLE,
} from '../config/throttler.config.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import { OIDC_PROVIDER } from '../oidc/oidc.provider.js';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistrationDto } from './dto/registration.dto.js';
import { UsernameTakenError } from './errors/registration-error.js';
import { InteractionService } from './interaction.service.js';

@Controller('interactions')
export class InteractionController {
  constructor(
    @Inject(OIDC_PROVIDER)
    private readonly oidc: IdProvider,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly credentialsService: CredentialsService,

    private readonly interactionService: InteractionService
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
    let user;
    try {
      user = await this.interactionService.registration(body);
    } catch (error: unknown) {
      if (error instanceof UsernameTakenError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    // If creating a new user fails due to email uniqueness violation,
    // proceed with a fake user ID to disallow guessing existing emails.
    // The `findAccount` method will skip fake user ID, and the user will get a generic error.
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
}
