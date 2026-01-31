import { Module } from '@nestjs/common';
import { ArtService } from './art.service.js';
import { ArtController } from './art.controller.js';

@Module({
  controllers: [ArtController],
  providers: [ArtService],
})
export class ArtModule {}
