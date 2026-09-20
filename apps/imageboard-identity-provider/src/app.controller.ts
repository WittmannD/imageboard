import {
  All,
  Controller,
  Inject,
  Next,
  type OnModuleInit,
  Req,
  Res,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Throttle } from '@nestjs/throttler';
import type { Application, Request, Response } from 'express';
import type IdProvider from 'oidc-provider';
import { match, type MatchFunction, type ParamData } from 'path-to-regexp';

import { OIDC_THROTTLE } from './config/throttler.config.js';
import { OIDC_PROVIDER } from './oidc/oidc.provider.js';

@Controller()
export class AppController implements OnModuleInit {
  private readonly callback: (req: Request, res: Response) => Promise<unknown>;
  private routes: MatchFunction<ParamData>[] = [];

  constructor(
    @Inject(OIDC_PROVIDER) oidc: IdProvider,
    private readonly adapterHost: HttpAdapterHost,
  ) {
    this.callback = oidc.callback();
  }

  onModuleInit(): void {
    const expressApp = this.adapterHost.httpAdapter.getInstance<Application>();

    this.routes = expressApp.router.stack.reduce<MatchFunction<ParamData>[]>(
      (acc, layer) => {
        if (layer.route && !layer.route.path.includes('*path')) {
          acc.push(match(layer.route.path));
        }

        return acc;
      },
      [],
    );
  }

  @Throttle(OIDC_THROTTLE)
  @All('*path')
  public async mountedOidc(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: () => unknown,
  ): Promise<unknown> {
    if (this.routes.some((route) => route(req.path))) {
      return next();
    }

    return this.callback(req, res);
  }
}
