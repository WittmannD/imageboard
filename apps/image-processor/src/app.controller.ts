import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  type ImageProcessingResponse,
  ImageProcessorMessagePattern,
} from '@hdotu1/image-processor-contract';

import { AppService } from './app.service.js';
import type { ImageProcessingMessageDto } from './dto/image-processing-message.dto.js';
import { ImageProcessingResponseFactory } from './factory/image-processing-response.factory.js';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @MessagePattern(ImageProcessorMessagePattern.ImageFromConfig)
  public async imageFromConfig(
    data: ImageProcessingMessageDto,
  ): Promise<ImageProcessingResponse> {
    const outputs = await firstValueFrom(
      this.appService.processFromConfig(data.key, data.variables),
    );
    return new ImageProcessingResponseFactory().createFromFileOutputs(outputs);
  }
}
