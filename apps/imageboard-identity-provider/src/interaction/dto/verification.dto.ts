import { IsUUID } from 'class-validator';

export class VerificationDto {
  @IsUUID()
  userId!: string;
}