import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { User } from '../common/decorators/user.decorator.js';
import { AuthGuard } from '../common/guard/auth.guard.js';
import type { UserEntity } from './entities/user.entity.js';
import type { UserService } from './service/user.service.js';
import { ProfileDto } from './dto/profile.dto.js';
import { UserDto } from './dto/user.dto.js';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  public async patchProfile(@User() user: UserEntity) {
    // todo: let user to edit username or/and avatar
    return user;
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
