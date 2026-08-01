import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import type IdProvider from 'oidc-provider';

import { OIDC_PROVIDER } from './oidc.provider.js';

@Controller("oidc")
export class OidcController {
  private readonly callback: (req: Request, res: Response) => Promise<unknown>;

  constructor(@Inject(OIDC_PROVIDER) oidc: IdProvider) {
    this.callback = oidc.callback();
  }

  @All("/*path")
  public async mountedOidc(@Req() req: Request, @Res() res: Response): Promise<unknown> {
    req.url = req.originalUrl.replace("/oidc", "");
    return await this.callback(req, res);
  }
}