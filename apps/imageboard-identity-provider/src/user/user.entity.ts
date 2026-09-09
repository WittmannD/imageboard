import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entity/base.entity.js';
import { CredentialsEntity } from '../credentials/credentials.entity.js';

export const USERNAME_UNIQUE_CONSTRAINT = 'UQ_user_username';
export const EMAIL_UNIQUE_CONSTRAINT = 'UQ_user_email';

@Entity()
export class UserEntity extends BaseEntity {
  @Index(USERNAME_UNIQUE_CONSTRAINT, { unique: true })
  @Column({ type: 'text', nullable: false })
  username!: string;

  @Index(EMAIL_UNIQUE_CONSTRAINT, { unique: true })
  @Column({ type: 'text', nullable: false })
  email!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  emailVerified = false;

  @OneToMany(() => CredentialsEntity, (credentials) => credentials.user)
  credentials!: CredentialsEntity[];
}