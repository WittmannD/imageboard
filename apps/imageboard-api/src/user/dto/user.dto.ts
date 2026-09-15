import { UserEntity } from '../entities/user.entity.js';
import { Exclude } from 'class-transformer';

export class UserDto extends UserEntity {
  @Exclude()
  override credentials!: never;

  @Exclude()
  override posts!: never;

  @Exclude()
  override updatedAt!: never;

  @Exclude()
  override deletedAt!: never;
}
