import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

export const Cookies = createParamDecorator<string, unknown>((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return data ? request.cookies[data] : request.cookies;
});

export const SignedCookies = createParamDecorator<string, unknown>((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return data ? request.signedCookies[data] : request.signedCookies;
});
