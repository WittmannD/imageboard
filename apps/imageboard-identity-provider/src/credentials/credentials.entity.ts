import bcrypt from 'bcrypt';
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entity/base.entity.js';
import { UserEntity } from '../user/user.entity.js';

@Entity('credentials')
export class CredentialsEntity extends BaseEntity {
  @Column({ nullable: false })
  passwordHash!: string;

  @Column({ nullable: false })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.credentials)
  @JoinColumn({ name: "userId" })
  user!: Relation<UserEntity>;

  async compare(password: string) {
    return await bcrypt.compare(password, this.passwordHash);
  }
}
