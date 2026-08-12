import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  SerializeOptions,
  UploadedFiles,
  UseGuards,
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
import { AuthGuard } from '../common/guard/auth.guard.js';
import { User } from '../common/decorators/user.decorator.js';
import type { UserEntity } from '../user/entities/user.entity.js';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  @SerializeOptions({ type: PostDraftDto })
  public async create(
    @User() user: UserEntity,
    @UploadedFiles() images: FileUpload[],
    @Body() body: CreatePostDto,
  ): Promise<PostDraftDto> {
    console.log(user);
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
