import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CompletePasswordResetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(80)
  password!: string;
}
