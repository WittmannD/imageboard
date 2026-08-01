import { Column, Entity, OneToMany } from 'typeorm';

import { OIDC_CLAIM_FIELD, OidcClaimField } from '../common/decorators/oidc-claim-field.decorator.js';
import { BaseEntity } from '../common/entity/base.entity.js';
import { CredentialsEntity } from '../credentials/credentials.entity.js';

@Entity()
export class UserEntity extends BaseEntity {
  @Column({ type: 'text', nullable: true, unique: true })
  @OidcClaimField('given_name')
  firstName?: string;

  @Column({ type: 'text', nullable: true, unique: true })
  @OidcClaimField('family_name')
  lastName?: string;

  @Column({ type: 'text', nullable: false, unique: true, default: false })
  @OidcClaimField('email')
  email!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  @OidcClaimField('email_verified')
  emailVerified: boolean = false;

  @OneToMany(() => CredentialsEntity, (credentials) => credentials.user)
  credentials!: CredentialsEntity[];

  getOidcFieldsMap() {
    const proto: object = Object.getPrototypeOf(this);

    const props: string[] =
      Reflect.getMetadata('oidcClaims:properties', proto) ?? [];

    return Object.fromEntries(
      props.map(prop => [
        Reflect.getMetadata(OIDC_CLAIM_FIELD, proto, prop),
        prop,
      ]),
    ) as Record<string, keyof UserEntity>;
  }
}