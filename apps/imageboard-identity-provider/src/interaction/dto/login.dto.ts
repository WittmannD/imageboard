import { IsEmail, IsString, MaxLength } from 'class-validator';

import { PASSWORD_MAX_LENGTH } from '@hdotu1/config';

export class LoginDto {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
