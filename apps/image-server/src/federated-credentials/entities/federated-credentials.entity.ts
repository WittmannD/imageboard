import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';

export const ISSUER_SUBJECT_UNIQUE_CONSTRAINT = 'issuer_subject_unique_constraint'

@Unique(ISSUER_SUBJECT_UNIQUE_CONSTRAINT, ['issuer', 'subject'])
@Entity('federated_credentials')
export class FederatedCredentialsEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false })
  issuer!: string;

  @Column({ type: 'text', nullable: false })
  subject!: string;

  @Column({ nullable: false })
  userId!: number;

  @ManyToOne(() => UserEntity, (user) => user.credentials)
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;
}
