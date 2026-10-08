import type { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { type DataSource, Repository } from 'typeorm';

import { prototypeToObject } from '../../common/utils/object.js';
import type { FileUpload } from '../../multer/file-upload.js';
import { MediaEntity, type MediaSource } from '../entities/media.entity.js';
import type { PostEntity } from '../entities/post.entity.js';
import { MediaProcessingStatus } from '../enums/media-status.enum.js';
import { mediaTypeOf } from '../enums/media-type.enum.js';

export class MediaRepository extends Repository<MediaEntity> {
  createDraftForPost(post: PostEntity, file: FileUpload): MediaEntity {
    return this.create({
      post,
      uploadUuid: file.uuid,
      key: '',
      type: mediaTypeOf(file.mimetype),
      status: MediaProcessingStatus.Processing,
      sourceSet: [],
    });
  }

  createDraftsForPost(post: PostEntity, files: FileUpload[]): MediaEntity[] {
    return files.map((file) => this.createDraftForPost(post, file));
  }

  // Set the derivatives of the medium and mark it as ready
  async setProcessedAssets(
    media: MediaEntity['id'] | MediaEntity,
    sources: MediaSource[],
  ) {
    if (!(media instanceof MediaEntity)) {
      media = await this.findOneByOrFail({ id: media });
    }

    media.sourceSet = sources;
    media.status = MediaProcessingStatus.Ready;

    return media;
  }
}

export const MediaRepositoryProvider = {
  provide: MediaRepository,
  inject: [getDataSourceToken()],
  useFactory: (dataSource: DataSource) => {
    return dataSource
      .getRepository(MediaEntity)
      .extend(prototypeToObject(MediaRepository.prototype));
  },
} as Provider;
