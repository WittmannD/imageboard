import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  type VideoProcessingResponse,
  VideoProcessorMessagePattern,
} from '@hdotu1/video-processor-contract';

import { AppService } from './app.service.js';
import type { VideoProcessingMessageDto } from './dto/video-processing-message.dto.js';
import { VideoProcessingResponseFactory } from './factory/video-processing-response.factory.js';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @MessagePattern(VideoProcessorMessagePattern.VideoFromConfig)
  public async processFromConfig(
    data: VideoProcessingMessageDto,
  ): Promise<VideoProcessingResponse> {
    const outputs = await firstValueFrom(
      this.appService.processFromConfig(
        data.key,
        data.variables,
        data.configKey,
      ),
    );
    return new VideoProcessingResponseFactory().createFromFileOutputs(outputs);
  }
}
