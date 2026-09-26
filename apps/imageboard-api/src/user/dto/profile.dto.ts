import { Exclude } from 'class-transformer';

import { UserEntity } from '../entities/user.entity.js';

export class ProfileDto extends UserEntity {
  @Exclude()
  override credentials!: never;

  @Exclude()
  override posts!: never;
}