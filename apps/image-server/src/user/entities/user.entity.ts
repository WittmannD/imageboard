import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { PostEntity } from '../../art/entities/post.entity.js';
import { CredentialsEntity } from '../../auth/entities/credentials.entity.js';
import { BaseEntity } from '../../common/entity/base.entity.js';

@Entity()
export class UserEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false, unique: true })
  username!: string;

  @Column({ type: 'text', nullable: false, unique: true })
  email!: string;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts!: PostEntity[];

  @ManyToOne(() => CredentialsEntity, (credentials) => credentials.user)
  credentials!: CredentialsEntity;
}