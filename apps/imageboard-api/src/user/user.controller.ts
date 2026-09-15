import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  SerializeOptions,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { User } from '../common/decorators/user.decorator.js';
import { AuthGuard } from '../common/guard/auth.guard.js';
import type { FileUpload } from '../multer/file-upload.js';
import { ProfileDto } from './dto/profile.dto.js';
import { UpdateUsernameDto } from './dto/update-username.dto.js';
import { UserDto } from './dto/user.dto.js';
import type { UserEntity } from './entities/user.entity.js';
import { UsernameTakenError } from './errors/user-service-error.js';
import { AvatarService } from './service/avatar.service.js';
import { UserService } from './service/user.service.js';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly avatarService: AvatarService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  @SerializeOptions({ type: ProfileDto })
  public async getProfile(@User() user: UserEntity) {
    const profile = await this.userService.findOneById(user.id);

    if (!profile) {
      throw new NotFoundException();
    }

    return profile;
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @SerializeOptions({ type: ProfileDto })
  public async patchProfile(
    @User() user: UserEntity,
    @Body() body: UpdateUsernameDto,
  ): Promise<ProfileDto> {
    try {
      return (await this.userService.updateUsername(
        user,
        body.username,
      )) as ProfileDto;
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @SerializeOptions({ type: ProfileDto })
  public async uploadAvatar(
    @User() user: UserEntity,
    @UploadedFile() avatar: FileUpload | undefined,
  ): Promise<ProfileDto> {
    if (!avatar) {
      throw new BadRequestException('Avatar file is required');
    }

    return (await this.avatarService.setAvatar(user, avatar)) as ProfileDto;
  }

  @Get(':id')
  @SerializeOptions({ type: UserDto })
  public async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOneById(id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }
}
