import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  SerializeOptions,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import type { KeySetQueryDto } from '../common/dto/key-set-query.dto.js';
import { PageDto } from '../common/dto/page.dto.js';
import type { FileUpload } from '../multer/file-upload.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import { PostDto } from './dto/post.dto.js';
import { PostDraftDto } from './dto/post-draft.dto.js';
import type { PostEntity } from './entities/post.entity.js';
import { PostService } from './post.service.js';
import type { PostPage } from './repositories/post.repository.js';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  @SerializeOptions({ type: PostDraftDto })
  public async create(
    @UploadedFiles() images: FileUpload[],
    @Body() body: CreatePostDto,
  ): Promise<PostDraftDto> {
    return (await this.postService.createPost(
      images,
      body,
    )) as PostDraftDto;
  }

  @Get()
  @SerializeOptions({ type: PageDto<PostDto>(PostDto) })
  public async getPaginated(
    @Query() queryParams: KeySetQueryDto<PostEntity>,
  ): Promise<PostPage> {
    return await this.postService.getPaginatedPosts(queryParams.cursor, {
      limit: queryParams.limit,
      order: queryParams.order,
    });
  }
}
