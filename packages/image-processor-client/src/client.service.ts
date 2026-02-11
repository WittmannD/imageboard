import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import {
  type ImageProcessingMessage,
  type ImageProcessingResponse,
  ImageProcessorMessagePattern,
} from '@hdotu1/image-processor-contract';

import { IMAGE_PROCESSOR_CLIENT_TOKEN } from './constants.js';

@Injectable()
export class ImageProcessorService {
  constructor(
    @Inject(IMAGE_PROCESSOR_CLIENT_TOKEN) private client: ClientProxy,
  ) {}

  public fromConfig(
    data: ImageProcessingMessage,
  ): Observable<ImageProcessingResponse> {
    return this.client.send(ImageProcessorMessagePattern.ImageFromConfig, data);
  }
}
