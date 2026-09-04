import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class AppController {
  @Get('/ip')
  public getIP(@Req() request: Request) {
    return { ip: request.ip };
  }
}
