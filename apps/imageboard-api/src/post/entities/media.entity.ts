import { Column, Entity, ManyToOne, type Relation } from 'typeorm';

import type { ImageOutput } from '@hdotu1/image-processor-contract';
import type { VideoOutput } from '@hdotu1/video-processor-contract';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { MediaProcessingStatus } from '../enums/media-status.enum.js';
import { MediaType } from '../enums/media-type.enum.js';
import { PostEntity } from './post.entity.js';

/** Derivatives of a medium, told apart by their `metadata.variant`. */
export type MediaSource = ImageOutput | VideoOutput;

/** An image or a video of a post's gallery. */
@Entity('media')
export class MediaEntity extends BaseEntity {
  @Column({ unique: true })
  uploadUuid!: string;

  @Column()
  key!: string;

  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  @Column({
    type: 'jsonb',
    default: [],
  })
  sourceSet: MediaSource[] = [];

  @Column({
    type: 'enum',
    enum: MediaProcessingStatus,
    default: MediaProcessingStatus.Pending,
  })
  status: MediaProcessingStatus = MediaProcessingStatus.Pending;

  @ManyToOne(() => PostEntity, (post) => post.media, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  post!: Relation<PostEntity>;
}
