import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(80)
  password!: string;
}