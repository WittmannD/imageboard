import type {RedisOptions} from "@nestjs/microservices";

export interface ImageProcessorClientOptions {
  redis: RedisOptions['options']
}