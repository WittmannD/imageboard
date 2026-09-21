import {
  BadRequestException,
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
import IdProvider, { errors, type Interaction } from 'oidc-provider';

import {
  CONSENT_THROTTLE,
  LOGIN_THROTTLE,
  REGISTRATION_THROTTLE,
} from '../config/throttler.config.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import scopesConfig from '../oidc/config/scopes.config.js';
import { API_RESOURCE_IDENTIFIER } from '../oidc/helpers/resource-indicators.js';
import { OIDC_PROVIDER } from '../oidc/oidc.provider.js';
import { UserService } from '../user/user.service.js';
import type { ConsentDetails } from './interfaces.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistrationDto } from './dto/registration.dto.js';
import { ErrorCode } from '../common/errors/error-code.js';
import { UsernameTakenError } from './errors/registration-error.js';
import { ErrorCodeFilter } from '../common/filters/error-code.filter.js';
import { InteractionRedirectFilter } from './filters/interaction-redirect.filter.js';
import { InteractionService } from './interaction.service.js';

@Controller('interactions')
@UseFilters(ErrorCodeFilter)
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

  @Get(':uid/consent')
  async getConsent(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ConsentDetails> {
    const { accountId, clientId, scopes } = await this.loadConsentInteraction(
      req,
      res,
    );
    const [user, client] = await Promise.all([
      this.userService.findOneById(accountId),
      this.oidc.Client.find(clientId),
    ]);

    if (!user || !client) {
      throw this.invalidInteraction();
    }

    return {
      client: {
        id: client.clientId,
        name: client.clientName ?? client.clientId,
        uri: client.clientUri,
        logoUri: client.logoUri,
        policyUri: client.policyUri,
        tosUri: client.tosUri,
      },
      account: { username: user.username, email: user.email },
      scopes,
    };
  }

  @Throttle(CONSENT_THROTTLE)
  @Post(':uid/consent')
  async grantConsent(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ redirectTo: string }> {
    const { details, accountId, clientId, scopes } =
      await this.loadConsentInteraction(req, res);

    // The grant is what the tokens are later filtered against: without it
    // (or with fewer scopes) the client gets less than it asked for.
    const grant =
      (details.grantId && (await this.oidc.Grant.find(details.grantId))) ||
      new this.oidc.Grant({ accountId, clientId });
    grant.addOIDCScope(scopes);
    // also grant the same scopes on the default resource so the JWT access
    // token issued for it (see resource-indicators.ts) carries them
    grant.addResourceScope(API_RESOURCE_IDENTIFIER, scopes);

    const redirectTo = await this.oidc.interactionResult(req, res, {
      consent: { grantId: await grant.save() },
    });

    return { redirectTo };
  }

  @Throttle(CONSENT_THROTTLE)
  @Post(':uid/consent/deny')
  async denyConsent(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ redirectTo: string }> {
    await this.loadConsentInteraction(req, res);

    // Send the client back with an OAuth error rather than a code. The login
    // that got us here stays valid - only this authorization is refused.
    const redirectTo = await this.oidc.interactionResult(
      req,
      res,
      {
        error: 'access_denied',
        error_description: 'The user denied the authorization request',
      },
      { mergeWithLastSubmission: false },
    );

    return { redirectTo };
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
        errorCode: ErrorCode.InvalidCredentials,
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
          errorCode: ErrorCode.UsernameTaken,
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

  /**
   * The consent endpoints only make sense mid-authorization, for a prompt that
   * really is the consent one, and for someone already logged in - anything
   * else is a stale or forged call.
   */
  private async loadConsentInteraction(req: Request, res: Response) {
    let details: Interaction;
    try {
      details = await this.oidc.interactionDetails(req, res);
    } catch (error: unknown) {
      if (error instanceof errors.SessionNotFound) {
        throw this.invalidInteraction();
      }
      throw error;
    }

    const accountId = details.session?.accountId;
    const clientId = details.params['client_id'];
    if (
      details.prompt.name !== 'consent' ||
      !accountId ||
      typeof clientId !== 'string'
    ) {
      throw this.invalidInteraction();
    }

    const supported = new Set(scopesConfig());
    const requested =
      typeof details.params['scope'] === 'string'
        ? details.params['scope'].split(' ')
        : [];
    const scopes = requested.filter((scope) => supported.has(scope));

    return { details, accountId, clientId, scopes };
  }

  private invalidInteraction() {
    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'The authorization request is invalid or has expired',
      errorCode: ErrorCode.InvalidInteraction,
    });
  }
}
