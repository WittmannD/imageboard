import {
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostStatus } from '../enums/post-status.enum.js';
import { PhotoEntity } from './photo.entity.js';

export class PostEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  caption: string | null = null;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.Draft })
  status: PostStatus = PostStatus.Draft;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PhotoEntity, (photo) => photo.post)
  photos!: PhotoEntity[];
}
