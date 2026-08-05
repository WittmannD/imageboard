import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entity/base.entity.js';
import { CredentialsEntity } from '../credentials/credentials.entity.js';

@Entity()
export class UserEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  firstName?: string;

  @Column({ type: 'text', nullable: true })
  lastName?: string;

  @Column({ type: 'text', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  emailVerified = false;

  @OneToMany(() => CredentialsEntity, (credentials) => credentials.user)
  credentials!: CredentialsEntity[];
}