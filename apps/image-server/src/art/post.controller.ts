import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import type { FileUpload } from '../multer/file-upload.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { PostDraftDto } from './dto/post-draft.dto.js';
import { PostFactory } from './factory/post.factory.js';
import { PostService } from './post.service.js';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  public async upload(
    @UploadedFiles() images: FileUpload[],
    @Body() body: CreatePostDto,
  ): Promise<PostDraftDto> {
    const postFactory = new PostFactory();
    const postEntity = await this.postService.createUserPost(images, body);
    return postFactory.createPostDraftDtoFromEntity(postEntity);
  }
}
