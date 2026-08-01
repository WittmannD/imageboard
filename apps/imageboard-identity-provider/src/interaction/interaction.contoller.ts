import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import IdProvider, { type Interaction } from 'oidc-provider';

import { CredentialsService } from '../credentials/credentials.service.js';
import { OIDC_PROVIDER } from '../oidc/oidc.provider.js';
import { UserService } from '../user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { RegistrationDto } from './dto/registration.dto.js';
import type { InteractionService } from './interaction.service.js';

@Controller('interactions')
export class InteractionController {
  constructor(
    @Inject(OIDC_PROVIDER)
    private readonly oidc: IdProvider,
    private readonly userService: UserService,
    private readonly credentialsService: CredentialsService,

    private readonly interactionService: InteractionService
  ) {}

  @Get(':uid')
  async getInteractionDetails(@Req() req: Request, @Res() res: Response): Promise<Interaction> {
    return await this.oidc.interactionDetails(req, res);
  }

  @Post(':uid/login')
  async login(@Req() req: Request, @Res() res: Response, @Body() body: LoginDto): Promise<void> {
    const user = await this.userService.findOneByEmail(body.email);

    if (!user) {
      await this.oidc.interactionFinished(req, res, {
        error: 'access_denied',
        error_description: 'Invalid credentials'
      });
      return;
    }

    const credentials = await this.credentialsService.getUserCredentialsByPassword(user.id, body.password);

    if (!credentials) {
      await this.oidc.interactionFinished(req, res, {
        error: 'access_denied',
        error_description: 'Invalid credentials'
      });
      return;
    }

    await this.oidc.interactionFinished(req, res, {
      login: {
        accountId: user.id,
        remember: false
      },
    });
  }

  @Post(':uid/registration')
  async registration(@Param('uid') uid: string, @Body() body: RegistrationDto): Promise<void> {
    await this.interactionService.registration(uid, body);
  }

  @Get(':uid/verification')
  async verification(@Req() req: Request, @Res() res: Response, @Param('uid') uid: string, @Query('token') verificationToken?: string): Promise<void> {
    if (!verificationToken) {
      await this.oidc.interactionFinished(req, res, {
        error: 'bad_request',
        error_description: 'Verification token is missing'
      });
      return;
    }

    const user = await this.interactionService.accountVerification(uid, verificationToken);

    if (!user) {
      await this.oidc.interactionFinished(req, res, {
        error: 'access_denied',
        error_description: 'Verification token is expired or already used'
      });
      return;
    }

    await this.oidc.interactionFinished(req, res, {
      login: {
        accountId: user.id,
        remember: false
      },
    });
  }
}
