import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ArtService } from './art.service.js';

@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {}

  @Post('/art')
  @UseInterceptors(FileInterceptor('image'))
  public upload(@UploadedFile() image: Express.Multer.File) {
    this.artService.handleUpload(image);
  }
}
