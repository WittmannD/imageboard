import { Brackets, SelectQueryBuilder } from 'typeorm';

import type { PageMetadataDecoded } from '../dto/page.dto.js';
import { BaseEntity } from '../entity/base.entity.js';
import type { KeySetCursor, KeySetOrder } from '../types/cursor.js';

export interface IdsPage<T> extends PageMetadataDecoded<T> {
  ids: number[];
}

export interface PaginateOptions {
  limit?: number;
  order?: KeySetOrder;
}

export async function paginate<Entity extends BaseEntity>(
  query: SelectQueryBuilder<Entity>,
  cursor: Partial<KeySetCursor<Entity>> = {},
  options: PaginateOptions = {},
): Promise<IdsPage<Entity>> {
  const { limit = 20, order = 'DESC' } = options;
  const { id, ...restFields } = cursor;
  const firstFieldEntry = Object.entries(restFields).at(0) ?? [];
  const [tieBreakerKey, tieBreakerValue] = firstFieldEntry;
  const tieBroken =
    tieBreakerKey !== undefined && tieBreakerValue !== undefined;
  const op = order === 'DESC' ? '<' : '>';

  query = query.addSelect(`${query.alias}.id`, `${query.alias}_id`);

  if (id === undefined) {
    // if there is no id in the cursor return the first page
    query = query.orderBy(`${query.alias}_id`, order).take(limit + 1);
  } else if (tieBroken) {
    // if there are id and tieBreaker values in the cursor return key-set-paginated page
    query = query
      .addSelect(
        `${query.alias}.${tieBreakerKey}`,
        `${query.alias}_tieBreaker`,
      )
      .orderBy(`${query.alias}_tieBreaker`, order)
      .addOrderBy(`${query.alias}_id`, order)
      .take(limit + 1)
      .andWhere(
        new Brackets((w) => {
          w.where(`${query.alias}_tieBreaker ${op} :tieBreakerValue`, {
            tieBreakerKey,
            tieBreakerValue,
          }).orWhere(
            new Brackets((w2) => {
              w2.where(`${query.alias}_tieBreaker = :tieBreakerValue`, {
                tieBreakerKey,
                tieBreakerValue,
              }).andWhere(`${query.alias}_id ${op} :id`, { id });
            }),
          );
        }),
      );
  } else {
    // if there is only id return a page based on it
    query = query
      .orderBy(`${query.alias}_id`, order)
      .take(limit + 1)
      .andWhere(`${query.alias}_id ${op} :id`, { id });
  }
  const idRows = await query.getMany();

  const hasNextPage = idRows.length > limit;
  const pageRows = hasNextPage ? idRows.slice(0, limit) : idRows;
  const ids = pageRows.map((r) => r.id);

  if (ids.length === 0) {
    return { ids: [], nextCursor: null, hasNextPage: false };
  }

  const last = pageRows[pageRows.length - 1];
  const nextCursor = hasNextPage
    ? ({ id: last.id } as KeySetCursor<Entity>)
    : null;

  if (tieBroken && nextCursor !== null) {
    const key = tieBreakerKey as keyof typeof restFields;
    nextCursor[key] = last[key];
  }

  return { ids, nextCursor, hasNextPage };
}
