import { Column, Entity, OneToMany } from 'typeorm';

import { PostEntity } from '../../art/entities/post.entity.js';
import { BaseEntity } from '../../common/entity/base.entity.js';
import { FederatedCredentialsEntity } from '../../federated-credentials/entities/federated-credentials.entity.js';

@Entity()
export class UserEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false, unique: true })
  username!: string;

  @Column({ type: 'text', nullable: false, unique: true })
  email!: string;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts!: PostEntity[];

  @OneToMany(() => FederatedCredentialsEntity, (credentials) => credentials.user)
  credentials!: FederatedCredentialsEntity[];
}