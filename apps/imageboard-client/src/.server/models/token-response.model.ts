import { Type } from 'class-transformer';
import {
  IsString,
  ValidateNested,
} from 'class-validator';
import 'reflect-metadata';

import { TokenClaimsModel } from './token-claims.model.ts';

export class TokenResponseModel {
  @IsString()
  access_token!: string;

  @IsString()
  refresh_token!: string;

  @Type(() => TokenClaimsModel)
  @ValidateNested()
  claims!: TokenClaimsModel;
}
