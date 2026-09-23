import { Injectable } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';
import { ImageProcessorService } from '@hdotu1/image-processor-client';

import { IMAGE_PROCESSING_TIMEOUT } from '../../config/configuration.js';
import type { FileUpload } from '../../multer/file-upload.js';
import type { UserEntity } from '../entities/user.entity.js';
import { AvatarProcessingError } from '../errors/user-service-error.js';
import { UserRepository } from '../repositories/user.repository.js';

// key of the transform config used by the image-processor service to derive avatar variants
const AVATAR_TRANSFORM_CONFIG = 'avatar-transform.config.yaml';

@Injectable()
export class AvatarService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly userRepository: UserRepository,
    private readonly tx: TransactionService,
  ) {}

  private async processAvatar(file: FileUpload) {
    try {
      const { images } = await firstValueFrom(
        this.imageProcessor
          .fromConfig({
            key: file.uuid,
            configKey: AVATAR_TRANSFORM_CONFIG,
          })
          .pipe(timeout(IMAGE_PROCESSING_TIMEOUT)),
      );

      return images;
    } catch (error) {
      // RPC error, broker connection failure, TimeoutError or EmptyError
      throw new AvatarProcessingError(error);
    }
  }

  async setAvatar(user: UserEntity, file: FileUpload, em?: EntityManager) {
    const images = await this.processAvatar(file);

    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(
        this.userRepository,
      );

      user.avatars = images;
      return await userRepository.save(user);
    });
  }
}
