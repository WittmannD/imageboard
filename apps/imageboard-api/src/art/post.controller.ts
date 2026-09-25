import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  SerializeOptions,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { SkipEmailVerification } from '../common/decorators/skip-email-verification.decorator.js';
import { User } from '../common/decorators/user.decorator.js';
import { KeySetQueryDto } from '../common/dto/key-set-query.dto.js';
import { PageDto } from '../common/dto/page.dto.js';
import { AuthGuard } from '../common/guard/auth.guard.js';
import { OptionalAuthGuard } from '../common/guard/optional-auth.guard.js';
import { ParseImageFilePipe } from '../common/pipes/parse-image-file.pipe.js';
import {
  ALLOWED_POST_IMAGE_FORMATS,
  MAX_IMAGES_PER_POST,
  POST_IMAGE_SIZE_LIMIT,
} from '../config/configuration.js';
import { CREATE_POST_THROTTLE } from '../config/throttler.config.js';
import type { FileUpload } from '../multer/file-upload.js';
import type { UserEntity } from '../user/entities/user.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { LikeStatusDto } from './dto/like-status.dto.js';
import { PostDraftDto } from './dto/post-draft.dto.js';
import { PostFeedItemDto } from './dto/post-feed-item.dto.js';
import type { PostEntity } from './entities/post.entity.js';
import { PostErrorFilter } from './post-error.filter.js';
import type { PostPage } from './repositories/post.repository.js';
import { LikeService } from './services/like.service.js';
import { PostService } from './services/post.service.js';

@UseFilters(PostErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly likeService: LikeService,
  ) {}

  @UseGuards(AuthGuard)
  @Throttle(CREATE_POST_THROTTLE)
  @Post()
  @UseInterceptors(FilesInterceptor('images', MAX_IMAGES_PER_POST))
  @SerializeOptions({ type: PostDraftDto })
  public async create(
    @User() user: UserEntity,
    @UploadedFiles(ParseImageFilePipe(ALLOWED_POST_IMAGE_FORMATS, POST_IMAGE_SIZE_LIMIT))
    images: FileUpload[],
    @Body() body: CreatePostDto,
  ): Promise<PostDraftDto> {
    return (await this.postService.createUserPost(
      user,
      images,
      body,
    )) as PostDraftDto;
  }

  // Public feed; a signed-in viewer (verified or not) also gets likedByMe
  @UseGuards(OptionalAuthGuard)
  @SkipEmailVerification()
  @Get()
  @SerializeOptions({ type: PageDto<PostFeedItemDto>(PostFeedItemDto) })
  public async getPaginated(
    @User() viewer: UserEntity | undefined,
    // transform: the DTO decodes the base64 cursor and converts the limit
    @Query(new ValidationPipe({ transform: true }))
    queryParams: KeySetQueryDto<PostEntity>,
  ): Promise<PostPage> {
    return await this.postService.getPaginatedPublishedPostsWithUser(
      queryParams.cursor,
      {
        limit: queryParams.limit,
        order: queryParams.order,
      },
      viewer,
    );
  }

  @UseGuards(AuthGuard)
  @Put(':id/like')
  @SerializeOptions({ type: LikeStatusDto })
  public async like(
    @User() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeStatusDto> {
    return await this.likeService.likePost(user, id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/like')
  @SerializeOptions({ type: LikeStatusDto })
  public async unlike(
    @User() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeStatusDto> {
    return await this.likeService.unlikePost(user, id);
  }
}
