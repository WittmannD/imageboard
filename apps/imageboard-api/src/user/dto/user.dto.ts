import { Exclude } from 'class-transformer';

import { UserEntity } from '../entities/user.entity.js';

export class UserDto extends UserEntity {
  @Exclude()
  override credentials!: never;

  @Exclude()
  override email!: never;

  @Exclude()
  override posts!: never;

  @Exclude()
  override updatedAt!: never;

  @Exclude()
  override deletedAt!: never;
}
