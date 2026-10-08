import { MediaEntity } from '../entities/media.entity.js';
import type { MediaProcessingStatus } from '../enums/media-status.enum.js';

export class MediaDraftDto extends MediaEntity {
  override status!: MediaProcessingStatus.Processing;
}
