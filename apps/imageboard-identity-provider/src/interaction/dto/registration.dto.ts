import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import type { CreateUser } from '../../common/interfaces.js';

export class RegistrationDto implements CreateUser {
  @IsString()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(80)
  password!: string;

  @IsString()
  @MaxLength(20)
  username!: string;
}
