import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import {
  type ImageFromConfigRequest,
  ImageProcessorMessagePattern,
} from '@hdotu1/image-processor-contract';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @MessagePattern(ImageProcessorMessagePattern.ImageFromConfig)
  public imageUploaded(data: ImageFromConfigRequest): void {
    this.appService.processFromConfig(data.path);
  }
}
