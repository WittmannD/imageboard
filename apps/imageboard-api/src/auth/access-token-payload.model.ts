import { Equals, IsBoolean, IsEmail, IsString } from 'class-validator';

export class AccessTokenPayloadModel {
  @IsString()
  sub!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  @Equals(true, { message: 'Email is not verified' })
  email_verified!: boolean;

  @IsString()
  preferred_username!: string;
}
