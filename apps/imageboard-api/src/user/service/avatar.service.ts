import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { EntityManager } from 'typeorm';

import { TransactionService } from '@hdotu1/database-common';
import { ImageProcessorService } from '@hdotu1/image-processor-client';

import type { FileUpload } from '../../multer/file-upload.js';
import type { UserEntity } from '../entities/user.entity.js';
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

  async setAvatar(user: UserEntity, file: FileUpload, em?: EntityManager) {
    const { images } = await firstValueFrom(
      this.imageProcessor.fromConfig({
        key: file.uuid,
        configKey: AVATAR_TRANSFORM_CONFIG,
      }),
    );

    return await this.tx.withManager(em, async (entityManager) => {
      const userRepository = entityManager.withRepository(
        this.userRepository,
      );

      user.avatars = images;
      return await userRepository.save(user);
    });
  }
}
