import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

import { PostEntity } from '../../art/entities/post.entity.js';
import { PostStatus } from '../../art/enums/post-status.enum.js';
import type { UserEntity } from '../../user/entities/user.entity.js';

export default setSeederFactory(PostEntity, (meta?: { user: UserEntity }) => {
  const post = new PostEntity();

  if (meta?.user) {
    post.user = meta.user;
  }

  post.caption = faker.lorem.sentence({ min: 3, max: 10 });
  post.status = PostStatus.Published;

  return post;
});
