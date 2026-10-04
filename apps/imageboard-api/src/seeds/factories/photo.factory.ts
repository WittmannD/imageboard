import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

import type { ImageOutput } from '@hdotu1/image-processor-contract';

import { PhotoEntity } from '../../post/entities/photo.entity.js';
import { PostEntity } from '../../post/entities/post.entity.js';
import { PhotoProcessingStatus } from '../../post/enums/photo-status.enum.js';

export default setSeederFactory(PhotoEntity, ((meta?: { post: PostEntity, sourceSet: ImageOutput[] }) => {
  const photo = new PhotoEntity();

  if (meta?.post) {
    photo.post = meta.post;
  }

  photo.status = PhotoProcessingStatus.Ready;
  photo.sourceSet = meta?.sourceSet ?? [];
  photo.uploadUuid = faker.string.uuid();
  photo.key = faker.string.uuid();

  return photo;
}));
