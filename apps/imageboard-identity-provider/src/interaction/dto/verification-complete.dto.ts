import { IsString, Length } from 'class-validator';

export class VerificationCompleteDto {
  @IsString()
  sessionId!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}
