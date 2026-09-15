import { IsString, Length, Matches } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username may only contain letters, numbers, underscores and hyphens',
  })
  username!: string;
}
