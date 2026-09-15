import { UserEntity } from '../entities/user.entity.js';
import { Exclude } from 'class-transformer';

export class ProfileDto extends UserEntity {
  @Exclude()
  override credentials!: never;

  @Exclude()
  override posts!: never;
}