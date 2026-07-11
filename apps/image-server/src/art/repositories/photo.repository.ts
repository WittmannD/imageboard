import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, Repository } from 'typeorm';

import type { ImageOutput } from '@hdotu1/image-processor-contract';

import { prototypeToObject } from '../../common/utils/object.js';
import type { FileUpload } from '../../multer/file-upload.js';
import { PhotoEntity } from '../entities/photo.entity.js';
import type { PostEntity } from '../entities/post.entity.js';
import { PhotoProcessingStatus } from '../enums/photo-status.enum.js';

export class PhotoRepository extends Repository<PhotoEntity> {
  createDraftForPost(post: PostEntity, file: FileUpload): PhotoEntity {
    return this.create({
      post,
      uploadUuid: file.uuid,
      key: '',
      status: PhotoProcessingStatus.Processing,
      sourceSet: [],
    });
  }

  createDraftsForPost(post: PostEntity, files: FileUpload[]): PhotoEntity[] {
    return files.map((file) => this.createDraftForPost(post, file));
  }

  async setProcessedAssets(
    photo: PhotoEntity['id'] | PhotoEntity,
    images: ImageOutput[],
  ) {
    if (!(photo instanceof PhotoEntity)) {
      photo = await this.findOneByOrFail({ id: photo });
    }

    photo.sourceSet = images;
    photo.status = PhotoProcessingStatus.Ready;

    return photo;
  }
}

export const PhotoRepositoryProvider = {
  provide: PhotoRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(PhotoEntity)
      .extend(prototypeToObject(PhotoRepository.prototype));
  },
} as Provider;
