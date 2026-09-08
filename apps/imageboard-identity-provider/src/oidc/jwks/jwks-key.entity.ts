import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/entity/base.entity.js';

@Entity('jwks_keys')
export class JwksKeyEntity extends BaseEntity {
  @Column({ type: 'text', nullable: false, unique: true })
  kid!: string;

  @Column({ type: 'text', nullable: false })
  alg!: string;

  // AES-256-GCM ciphertext of the JWK (iv + authTag + ciphertext, base64),
  // encrypted with JWKS_MASTER_ENCRYPTION_KEY. See JwksEncryptionService.
  @Column({ type: 'text', nullable: false })
  encryptedJwk!: string;
}
