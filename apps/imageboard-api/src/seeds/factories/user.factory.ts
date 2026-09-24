import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';
import { UserEntity } from '../../user/entities/user.entity.js';

export default setSeederFactory(UserEntity, () => {
  const user = new UserEntity();

  user.username = faker.internet.username();
  user.email = faker.internet.email({
    firstName: user.username
  });

  return user;
});
