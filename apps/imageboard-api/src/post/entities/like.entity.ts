import { Entity, ManyToOne, type Relation, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';
import { PostEntity } from './post.entity.js';

// Likes are hard-deleted on unlike, so the unique constraint never trips on a
// soft-deleted row
@Entity('likes')
@Unique(['user', 'post'])
export class LikeEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  user!: Relation<UserEntity>;

  @ManyToOne(() => PostEntity, { nullable: false, onDelete: 'CASCADE' })
  post!: Relation<PostEntity>;
}
