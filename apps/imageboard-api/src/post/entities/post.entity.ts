import { Column, Entity, ManyToOne, OneToMany, type Relation } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';
import { MediaEntity } from './media.entity.js';

@Entity('posts')
export class PostEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  caption: string | null = null;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.Draft })
  status: PostStatus = PostStatus.Draft;

  @Column({ type: 'integer', default: 0, update: false })
  likesCount = 0;

  @OneToMany(() => MediaEntity, (media) => media.post)
  media!: MediaEntity[];

  @ManyToOne(() => UserEntity, (user) => user.posts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user!: Relation<UserEntity>;
}
