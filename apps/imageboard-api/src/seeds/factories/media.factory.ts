import { faker } from '@faker-js/faker';
import { setSeederFactory } from 'typeorm-extension';

import {
  MediaEntity,
  type MediaSource,
} from '../../post/entities/media.entity.js';
import { PostEntity } from '../../post/entities/post.entity.js';
import { MediaProcessingStatus } from '../../post/enums/media-status.enum.js';
import { MediaType } from '../../post/enums/media-type.enum.js';

export default setSeederFactory(
  MediaEntity,
  (meta?: { post: PostEntity; type?: MediaType; sourceSet: MediaSource[] }) => {
    const media = new MediaEntity();

    if (meta?.post) {
      media.post = meta.post;
    }

    media.type = meta?.type ?? MediaType.Image;
    media.status = MediaProcessingStatus.Ready;
    media.sourceSet = meta?.sourceSet ?? [];
    media.uploadUuid = faker.string.uuid();
    media.key = faker.string.uuid();

    return media;
  },
);
