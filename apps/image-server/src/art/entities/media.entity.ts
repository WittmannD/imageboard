import {
  CreateDateColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PhotoEntity } from './photo.entity.js';
import { PostEntity } from './post.entity.js';

export class MediaEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToMany(() => PhotoEntity)
  @JoinTable()
  photos!: PhotoEntity[];

  @ManyToOne(() => PostEntity, (post) => post.media)
  post!: PostEntity;
}
