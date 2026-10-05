import { PartialType } from '@nestjs/mapped-types';

import { CreatePostDto } from './create-post.dto.js';

export class UpdateArtDto extends PartialType(CreatePostDto) {}
