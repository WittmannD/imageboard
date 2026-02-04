import { PartialType } from '@nestjs/mapped-types';

import { CreateArtDto } from './create-art.dto.js';

export class UpdateArtDto extends PartialType(CreateArtDto) {}
