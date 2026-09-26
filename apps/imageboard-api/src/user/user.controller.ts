import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { SkipEmailVerification } from '../common/decorators/skip-email-verification.decorator.js';
import { User } from '../common/decorators/user.decorator.js';
import { AuthGuard } from '../common/guard/auth.guard.js';
import { ParseImageFilePipe } from '../common/pipes/parse-image-file.pipe.js';
import {
  ALLOWED_AVATAR_FORMATS,
  AVATAR_SIZE_LIMIT,
} from '../config/configuration.js';
import type { FileUpload } from '../multer/file-upload.js';
import { ProfileDto } from './dto/profile.dto.js';
import { UpdateUsernameDto } from './dto/update-username.dto.js';
import { UserDto } from './dto/user.dto.js';
import type { UserEntity } from './entities/user.entity.js';
import { AvatarService } from './service/avatar.service.js';
import { UserService } from './service/user.service.js';
import { UserErrorFilter } from './user-error.filter.js';
import { UserStatsDto } from './dto/user-stats.dto.js';

@UseFilters(UserErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly avatarService: AvatarService,
  ) {}

  @UseGuards(AuthGuard)
  @SkipEmailVerification()
  @Get('me')
  @SerializeOptions({ type: ProfileDto })
  public async getProfile(@User() unverifiedUser: UserEntity) {
    return await this.userService.getOneById(unverifiedUser.id);
  }

  @UseGuards(AuthGuard)
  @SkipEmailVerification()
  @Patch('me')
  @SerializeOptions({ type: ProfileDto })
  public async patchProfile(
    @User() unverifiedUser: UserEntity,
    @Body() body: UpdateUsernameDto,
  ): Promise<ProfileDto> {
    return (await this.userService.updateUsername(
      unverifiedUser,
      body.username,
    )) as ProfileDto;
  }

  @UseGuards(AuthGuard)
  @SkipEmailVerification()
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @SerializeOptions({ type: ProfileDto })
  public async uploadAvatar(
    @User() unverifiedUser: UserEntity,
    // the pipe rejects a missing file with file_required
    @UploadedFile(ParseImageFilePipe(ALLOWED_AVATAR_FORMATS, AVATAR_SIZE_LIMIT))
    avatar: FileUpload,
  ): Promise<ProfileDto> {
    return (await this.avatarService.setAvatar(
      unverifiedUser,
      avatar,
    )) as ProfileDto;
  }

  @Get(':id')
  @SerializeOptions({ type: UserDto })
  public async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getOneById(id);
  }

  @Get(':id/stats')
  @SerializeOptions({ type: UserStatsDto })
  public async getUserStats(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserStatsByUserId(id);
  }
}
