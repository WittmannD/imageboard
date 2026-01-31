import {Controller, Post, UseInterceptors, UploadedFile} from '@nestjs/common';
import { ArtService } from './art.service.js';
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('art')
export class ArtController {
  constructor(private readonly artService: ArtService) {
  }

  @Post('/art')
  @UseInterceptors(FileInterceptor('image'))
  public upload(
    @UploadedFile() image: Express.Multer.File
  ) {
    this.artService.handleUpload(image);
  }
}
