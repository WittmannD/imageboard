import {
  Column,
  CreateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { ImageOutput } from '@hdotu1/image-processor-contract';

import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';
import { PostEntity } from './post.entity.js';

export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  uploadUuid!: string;

  @Column()
  key!: string;

  @Column({
    type: 'jsonb',
    default: [],
  })
  sourceSet: ImageOutput[] = [];

  @Column({
    type: 'enum',
    enum: PhotoProcessingStatus,
    default: PhotoProcessingStatus.Pending,
  })
  status: PhotoProcessingStatus = PhotoProcessingStatus.Pending;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => PostEntity, (post) => post.photos)
  post!: PostEntity;
}
