import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

import type { KeySetCursor, KeySetOrder } from '../types/cursor.js';
import { decodeBase64Json } from '../utils/base64-json.js';

export class KeySetQueryDto<T> {
  @Transform(
    ({ value }): KeySetCursor<T> | undefined => {
      if (value == null || value === '') return undefined;

      if (typeof value !== 'string') {
        throw new BadRequestException('Cursor must be a base64 string');
      }

      try {
        return decodeBase64Json(value) as KeySetCursor<T>;
      } catch {
        throw new BadRequestException('Invalid base64/json in cursor');
      }
    },
    { toClassOnly: true },
  )
  @IsOptional()
  @IsObject()
  cursor?: KeySetCursor<T>;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : String(value),
  )
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: KeySetOrder;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
