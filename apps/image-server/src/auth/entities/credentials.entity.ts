import { Column, Entity, ManyToOne, type Relation, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';

@Entity('credentials')
@Unique(['issuer', 'subject'])
export class CredentialsEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.credentials)
  user!: Relation<UserEntity>;

  @Column({ type: 'text', nullable: false })
  issuer!: string;

  @Column({ type: 'text', nullable: false })
  subject!: string;
}
