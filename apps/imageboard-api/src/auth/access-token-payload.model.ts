import { Equals, IsBoolean, IsEmail, IsString } from 'class-validator';

export const VERIFIED_EMAIL_GROUP = 'verified-email';

export class AccessTokenPayloadModel {
  @IsString()
  sub!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  @Equals(true, {
    message: 'Email is not verified',
    groups: [VERIFIED_EMAIL_GROUP],
  })
  email_verified!: boolean;

  @IsString()
  preferred_username!: string;
}
