import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { type Seeder, SeederFactoryManager } from 'typeorm-extension';

import type { ImageOutput } from '@hdotu1/image-processor-contract';

import { PhotoEntity } from '../../art/entities/photo.entity.js';
import { PostEntity } from '../../art/entities/post.entity.js';
import { FederatedCredentialsEntity } from '../../federated-credentials/entities/federated-credentials.entity.js';
import { UserEntity } from '../../user/entities/user.entity.js';

const galleries = [
  [
    [
      {
        key: 'eebe27d5-1d1e-46fc-90bd-9753e1a36a42_tile.jpeg',
        size: 18654,
        width: 241,
        format: 'jpeg',
        height: 393,
        metadata: {
          tile: {
            fit: 'contain',
            key: 'eebe27d5-1d1e-46fc-90bd-9753e1a36a42',
            row: 1,
            width: 241,
            column: 1,
            height: 393,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
      {
        key: 'eebe27d5-1d1e-46fc-90bd-9753e1a36a42_lightbox.jpeg',
        size: 81880,
        width: 661,
        format: 'jpeg',
        height: 1080,
        metadata: {
          variant: 'lightbox',
        },
      },
    ],
    [
      {
        key: 'b37253fe-3f7b-4a58-bf65-a3b8c7fccd76_lightbox.jpeg',
        size: 107053,
        width: 735,
        format: 'jpeg',
        height: 972,
        metadata: {
          variant: 'lightbox',
        },
      },
      {
        key: 'b37253fe-3f7b-4a58-bf65-a3b8c7fccd76_tile.jpeg',
        size: 28313,
        width: 297,
        format: 'jpeg',
        height: 393,
        metadata: {
          tile: {
            fit: 'contain',
            key: 'b37253fe-3f7b-4a58-bf65-a3b8c7fccd76',
            row: 1,
            width: 297,
            column: 2,
            height: 393,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
    ],
  ],
  [
    [
      {
        key: '847bc405-f3a3-4d26-a267-f00204d29e2c_tile.jpeg',
        size: 18264,
        width: 240,
        format: 'jpeg',
        height: 392,
        metadata: {
          tile: {
            fit: 'contain',
            key: '847bc405-f3a3-4d26-a267-f00204d29e2c',
            row: 1,
            width: 240,
            column: 2,
            height: 392,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
      {
        key: '847bc405-f3a3-4d26-a267-f00204d29e2c_lightbox.jpeg',
        size: 81880,
        width: 661,
        format: 'jpeg',
        height: 1080,
        metadata: {
          variant: 'lightbox',
        },
      },
    ],
    [
      {
        key: 'fa1388e9-56f3-4663-bfa5-28372ac61dd3_lightbox.jpeg',
        size: 105632,
        width: 736,
        format: 'jpeg',
        height: 969,
        metadata: {
          variant: 'lightbox',
        },
      },
      {
        key: 'fa1388e9-56f3-4663-bfa5-28372ac61dd3_tile.jpeg',
        size: 29721,
        width: 298,
        format: 'jpeg',
        height: 392,
        metadata: {
          tile: {
            fit: 'contain',
            key: 'fa1388e9-56f3-4663-bfa5-28372ac61dd3',
            row: 1,
            width: 298,
            column: 1,
            height: 392,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
    ],
  ],
  [
    [
      {
        key: 'c5c9a047-a675-4af4-bd2e-d1f56a8cb0c2_lightbox.jpeg',
        size: 89938,
        width: 735,
        format: 'jpeg',
        height: 972,
        metadata: {
          variant: 'lightbox',
        },
      },
      {
        key: 'c5c9a047-a675-4af4-bd2e-d1f56a8cb0c2_tile.jpeg',
        size: 12690,
        width: 203,
        format: 'jpeg',
        height: 268,
        metadata: {
          tile: {
            fit: 'contain',
            key: 'c5c9a047-a675-4af4-bd2e-d1f56a8cb0c2',
            row: 1,
            width: 203,
            column: 3,
            height: 268,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
    ],
    [
      {
        key: '0202487e-87b0-4ba2-8149-7eb1d3c72206_lightbox.jpeg',
        size: 85432,
        width: 662,
        format: 'jpeg',
        height: 1080,
        metadata: {
          variant: 'lightbox',
        },
      },
      {
        key: '0202487e-87b0-4ba2-8149-7eb1d3c72206_tile.jpeg',
        size: 9787,
        width: 165,
        format: 'jpeg',
        height: 268,
        metadata: {
          tile: {
            fit: 'contain',
            key: '0202487e-87b0-4ba2-8149-7eb1d3c72206',
            row: 1,
            width: 165,
            column: 2,
            height: 268,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
    ],
    [
      {
        key: '0b3c8b7a-17ea-4fbc-aa32-662ca1461447_tile.jpeg',
        size: 9434,
        width: 165,
        format: 'jpeg',
        height: 268,
        metadata: {
          tile: {
            fit: 'contain',
            key: '0b3c8b7a-17ea-4fbc-aa32-662ca1461447',
            row: 1,
            width: 165,
            column: 1,
            height: 268,
            rowSpan: 1,
            columnSpan: 1,
          },
          variant: 'tile',
        },
      },
      {
        key: '0b3c8b7a-17ea-4fbc-aa32-662ca1461447_lightbox.jpeg',
        size: 77958,
        width: 662,
        format: 'jpeg',
        height: 1080,
        metadata: {
          variant: 'lightbox',
        },
      },
    ],
  ],
];

const photoGalleryFactory = (): ImageOutput[][] => {
  const index = faker.number.int({ min: 0, max: 2 });
  const gallery = galleries[index];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!gallery) {
    return [];
  }

  return gallery;
};

export default class PostSeeder implements Seeder {
  public async run(
    _dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userFactory = factoryManager.get(UserEntity);
    const postFactory = factoryManager.get(PostEntity);
    const photoFactory = factoryManager.get(PhotoEntity);
    const credentialsFactory = factoryManager.get(FederatedCredentialsEntity);

    const users = await userFactory.saveMany(5);

    for (const user of users) {
      await credentialsFactory.setMeta({ user }).save();
      const posts = await postFactory.setMeta({ user }).saveMany(5);

      for (const post of posts) {
        const gallery = photoGalleryFactory();

        for (const images of gallery) {
          await photoFactory.setMeta({ post, sourceSet: images }).save();
        }
      }
    }
  }
}
