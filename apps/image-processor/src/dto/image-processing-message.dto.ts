import { IsObject, IsOptional, IsString } from 'class-validator';

import type { ImageProcessingMessage } from '@hdotu1/image-processor-contract';

export class ImageProcessingMessageDto implements ImageProcessingMessage {
  @IsString()
  path!: string;

  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}
