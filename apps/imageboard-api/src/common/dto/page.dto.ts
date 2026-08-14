import type { Type } from '@nestjs/common';
import { Transform, Type as TransformType } from 'class-transformer';

import type { KeySetCursor } from '../types/cursor.js';
import { encodeBase64Json } from '../utils/base64-json.js';

export interface PageMetadataDecoded<T> {
  nextCursor: KeySetCursor<T> | null;
  hasNextPage: boolean;
}

export const PageDto = <T>(ItemDto: Type<T>) => {
  abstract class Page implements PageMetadataDecoded<T> {
    @TransformType(() => ItemDto)
    items!: T[];

    @Transform(
      ({ value }): string | null => {
        if (value == null) return null;
        return encodeBase64Json(value);
      },
      { toPlainOnly: true },
    )
    nextCursor!: KeySetCursor<T> | null;
    hasNextPage!: boolean;
  }

  return Page as Type<Page>;
};
