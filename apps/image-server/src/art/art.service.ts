import {Injectable} from '@nestjs/common';
import {ImageProcessorService} from "@hdotu1/image-processor-client";

@Injectable()
export class ArtService {
  constructor(
    private imageProcessor: ImageProcessorService
  ) {}

  handleUpload(image: Express.Multer.File) {
    this.imageProcessor.processImage({
      path: image.path,
      mimetype: image.mimetype
    }).subscribe()
  }
}
