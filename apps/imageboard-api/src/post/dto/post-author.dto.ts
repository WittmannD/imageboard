import { Exclude } from 'class-transformer';

import { UserEntity } from '../../user/entities/user.entity.js';

export class PostAuthorDto extends UserEntity {
  @Exclude()
  override posts!: never;

  @Exclude()
  override credentials!: never;
}
