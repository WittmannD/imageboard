import { IsString, Length, Matches } from 'class-validator';

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '@hdotu1/config';

export class UpdateUsernameDto {
  @IsString()
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
  @Matches(USERNAME_PATTERN, {
    message: 'Username may only contain letters, numbers and underscores',
  })
  username!: string;
}
