import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { PostStatus } from '../enums/post-status.enum.js';
import { PhotoEntity } from './photo.entity.js';

@Entity()
export class PostEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  caption: string | null = null;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.Draft })
  status: PostStatus = PostStatus.Draft;

  @OneToMany(() => PhotoEntity, (photo) => photo.post)
  photos!: PhotoEntity[];
}
