import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
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
import { InteractionErrorCode } from './errors/interaction-error-code.js';
import { UsernameTakenError } from './errors/registration-error.js';
import { InteractionErrorCodeFilter } from './filters/interaction-error-code.filter.js';
import { InteractionRedirectFilter } from './filters/interaction-redirect.filter.js';
import { InteractionService } from './interaction.service.js';

@Controller('interactions')
@UseFilters(InteractionErrorCodeFilter)
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
  @UseFilters(InteractionRedirectFilter)
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
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ): Promise<{ redirectTo: string }> {
    const user = await this.userService.findOneByEmail(body.email);
    const credentials =
      user &&
      (await this.credentialsService.getUserCredentialsByPassword(
        user.id,
        body.password,
      ));

    if (!user || !credentials) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
        errorCode: InteractionErrorCode.InvalidCredentials,
      });
    }

    const redirectTo = await this.oidc.interactionResult(req, res, {
      login: {
        accountId: user.id,
        remember: true,
      },
    });

    return { redirectTo };
  }

  @Throttle(REGISTRATION_THROTTLE)
  @Post(':uid/registration')
  async registration(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RegistrationDto,
  ): Promise<{ redirectTo: string }> {
    let user;
    try {
      user = await this.interactionService.registration(body);
    } catch (error: unknown) {
      if (error instanceof UsernameTakenError) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
          errorCode: InteractionErrorCode.UsernameTaken,
        });
      }
      throw error;
    }
    // If creating a new user fails due to email uniqueness violation,
    // proceed with a fake user ID to disallow guessing existing emails.
    // The `findAccount` method will skip fake user ID, and the user will get a generic error.
    const userId = user?.id ?? 'untrusted-' + this.userService.generateId();

    try {
      const redirectTo = await this.oidc.interactionResult(req, res, {
        login: {
          accountId: userId,
          remember: true,
        },
      });

      return { redirectTo };
    } catch (error: unknown) {
      // The user (and their credentials) already committed to the database
      // in `interactionService.registration` above - a completely separate
      // store from the OIDC interaction session this call just failed to
      // resolve. Undo the account so the email isn't stuck unable to ever
      // register again.
      if (user) {
        await this.interactionService.rollbackRegistration(user.id);
      }
      throw error;
    }
  }
}
