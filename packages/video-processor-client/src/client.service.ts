import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import {
  type VideoProbeMessage,
  type VideoProbeResponse,
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

  public probe(data: VideoProbeMessage): Observable<VideoProbeResponse> {
    return this.client.send<VideoProbeResponse, VideoProbeMessage>(
      VideoProcessorMessagePattern.VideoProbe,
      data,
    );
  }
}
