import { IsObject, IsOptional, IsString } from 'class-validator';

import type { VideoProcessingMessage } from '@hdotu1/video-processor-contract';

export class VideoProcessingMessageDto implements VideoProcessingMessage {
  @IsString()
  key!: string;

  @IsOptional()
  @IsString()
  configKey?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}
