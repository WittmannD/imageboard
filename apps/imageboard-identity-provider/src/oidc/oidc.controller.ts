import { All, Controller, Inject, Next, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type IdProvider from 'oidc-provider';

import { OIDC_THROTTLE } from '../config/throttler.config.js';
import { OIDC_PROVIDER } from './oidc.provider.js';

@Controller()
export class OidcController {
  private readonly callback: (req: Request, res: Response) => Promise<unknown>;

  constructor(@Inject(OIDC_PROVIDER) oidc: IdProvider) {
    this.callback = oidc.callback();
  }

  @Throttle(OIDC_THROTTLE)
  @All("*path")
  public async mountedOidc(@Req() req: Request, @Res() res: Response, @Next() next: () => unknown): Promise<unknown> {
    if (req.originalUrl.startsWith("/interactions")) {
      return next();
    }

    req.url = req.originalUrl.replace("/oidc", "");
    return this.callback(req, res);
  }
}