import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

import { FederatedCredentialsEntity } from '../../federated-credentials/entities/federated-credentials.entity.js';
import type { UserEntity } from '../../user/entities/user.entity.js';

export default setSeederFactory(
  FederatedCredentialsEntity,
  (meta?: { user: UserEntity }) => {
    const credentials = new FederatedCredentialsEntity();

    if (meta?.user) {
      credentials.userId = meta.user.id;
      credentials.user = meta.user;
    }

    credentials.subject = faker.string.uuid();
    credentials.issuer = faker.internet.domainName();

    return credentials;
  },
);
