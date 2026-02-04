import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import { IMAGE_PROCESSOR_CLIENT_TOKEN } from './constants.js';
import {
  PROCESS_IMAGE_MESSAGE,
  type ProcessImageMessage,
} from './messages/process-image-message.js';

@Injectable()
export class ImageProcessorService {
  constructor(
    @Inject(IMAGE_PROCESSOR_CLIENT_TOKEN) private client: ClientProxy,
  ) {}

  public processImage(data: ProcessImageMessage): Observable<unknown> {
    return this.client.send(PROCESS_IMAGE_MESSAGE, data);
  }
}
