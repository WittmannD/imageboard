import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';

export const ISSUER_SUBJECT_UNIQUE_CONSTRAINT = 'issuer_subject_unique_constraint'

@Entity('federated_credentials')
@Unique(ISSUER_SUBJECT_UNIQUE_CONSTRAINT, ['issuer', 'subject'])
export class FederatedCredentialsEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false })
  issuer!: string;

  @Column({ type: 'text', nullable: false })
  subject!: string;

  @Column({ nullable: false })
  userId!: number;

  @ManyToOne(() => UserEntity, (user) => user.credentials)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
