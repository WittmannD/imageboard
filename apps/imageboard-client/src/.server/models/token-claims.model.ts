import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsString } from 'class-validator';
import 'reflect-metadata';

export class TokenClaimsModel {
  @IsString()
  sub!: string;

  @IsEmail({}, { message: 'Invalid email' })
  email!: string;

  @Type(() => Boolean)
  @IsBoolean()
  email_verified!: boolean;
}
