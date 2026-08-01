import { Optional } from '@nestjs/common';
import { IsEmail, IsString, MaxLength } from 'class-validator';

import type { CreateUser } from '../../common/interfaces.js';

export class RegistrationDto implements CreateUser {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(80)
  password!: string;

  @Optional()
  @IsString()
  @MaxLength(20)
  firstName?: string;

  @Optional()
  @IsString()
  @MaxLength(20)
  lastName?: string;
}
