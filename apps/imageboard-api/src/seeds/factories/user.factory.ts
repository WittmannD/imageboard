import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@hdotu1/config';

import { UserEntity } from '../../user/entities/user.entity.js';

export default setSeederFactory(UserEntity, () => {
  const user = new UserEntity();

  // faker's usernames may contain dots and hyphens; fit them to the username rules.
  user.username = faker.internet
    .username()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .padEnd(USERNAME_MIN_LENGTH, '_')
    .slice(0, USERNAME_MAX_LENGTH);
  user.email = faker.internet.email({
    firstName: user.username
  });

  return user;
});
