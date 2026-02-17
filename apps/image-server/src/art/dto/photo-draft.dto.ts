import { PhotoEntity } from '../entities/photo.entity.js';
import type { PhotoProcessingStatus } from '../enums/photo-status.enum.js';

export class PhotoDraftDto extends PhotoEntity {
  override status!: PhotoProcessingStatus.Processing;
}
