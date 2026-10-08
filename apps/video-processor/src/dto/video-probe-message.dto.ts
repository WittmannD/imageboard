import { IsString } from 'class-validator';

import type { VideoProbeMessage } from '@hdotu1/video-processor-contract';

export class VideoProbeMessageDto implements VideoProbeMessage {
  @IsString()
  key!: string;
}
