import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import {
  type VideoProcessingMessage,
  type VideoProcessingResponse,
  VideoProcessorMessagePattern,
} from '@hdotu1/video-processor-contract';

import { VIDEO_PROCESSOR_CLIENT_TOKEN } from './constants.js';

@Injectable()
export class VideoProcessorService {
  constructor(
    @Inject(VIDEO_PROCESSOR_CLIENT_TOKEN) private client: ClientProxy,
  ) {}

  public fromConfig(
    data: VideoProcessingMessage,
  ): Observable<VideoProcessingResponse> {
    return this.client.send<VideoProcessingResponse, VideoProcessingMessage>(
      VideoProcessorMessagePattern.VideoFromConfig,
      data,
    );
  }
}
