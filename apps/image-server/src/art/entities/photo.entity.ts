import { Column, Entity, ManyToOne } from 'typeorm';

import type { ImageOutput } from '@hdotu1/image-processor-contract';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';
import { PostEntity } from './post.entity.js';

@Entity()
export class PhotoEntity extends BaseEntity {
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

  @ManyToOne(() => PostEntity, (post) => post.photos)
  post!: PostEntity;
}
