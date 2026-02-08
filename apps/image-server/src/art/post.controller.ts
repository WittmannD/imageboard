import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { CreatePostDto } from './dto/create-post.dto.js';
import { PostService } from './post.service.js';

@Controller('art')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('/post')
  @UseInterceptors(FileInterceptor('image'))
  public upload(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: CreatePostDto,
  ) {
    this.postService.createUserPost(image);
  }
}
