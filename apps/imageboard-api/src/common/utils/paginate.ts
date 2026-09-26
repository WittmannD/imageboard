import { Brackets, QueryFailedError, SelectQueryBuilder } from 'typeorm';

import type { PageMetadataDecoded } from '../dto/page.dto.js';
import { BaseEntity } from '../entity/base.entity.js';
import { InvalidCursorError } from '../errors/common-errors.js';
import type { KeySetCursor, KeySetOrder } from '../types/cursor.js';

export interface IdsPage<T> extends PageMetadataDecoded<T> {
  ids: number[];
}

export interface PaginateOptions {
  limit?: number;
  order?: KeySetOrder;
  /** Cursor fields allowed as the tie-breaker; defaults to BaseEntity's. */
  sortableFields?: readonly string[];
}

const DEFAULT_SORTABLE_FIELDS = ['createdAt'];

// The cursor comes from the client as decoded JSON, so its shape is
// unchecked. Field names are interpolated into SQL and must be allow-listed.
function assertValidCursor(
  cursor: Partial<KeySetCursor<unknown>>,
  sortableFields: readonly string[],
) {
  const { id, ...restFields } = cursor as Record<string, unknown>;

  if (id !== undefined && !Number.isSafeInteger(id)) {
    throw new InvalidCursorError('Cursor id must be an integer');
  }

  for (const [key, value] of Object.entries(restFields)) {
    if (!sortableFields.includes(key)) {
      throw new InvalidCursorError(`Cannot paginate by "${key}"`);
    }

    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      !(value instanceof Date)
    ) {
      throw new InvalidCursorError(`Invalid cursor value for "${key}"`);
    }
  }
}

// SQLSTATE class 22 (data exception): a cursor value Postgres can't
// interpret for its column, e.g. a malformed date
function isDataException(error: unknown) {
  const code = (error instanceof QueryFailedError
    ? (error.driverError as { code?: unknown } | undefined)?.code
    : undefined);

  return typeof code === 'string' && code.startsWith('22');
}

export async function paginate<Entity extends BaseEntity>(
  query: SelectQueryBuilder<Entity>,
  cursor: Partial<KeySetCursor<Entity>> = {},
  options: PaginateOptions = {},
): Promise<IdsPage<Entity>> {
  const {
    limit = 20,
    order = 'DESC',
    sortableFields = DEFAULT_SORTABLE_FIELDS,
  } = options;
  assertValidCursor(cursor, sortableFields);

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
          w.where(`${query.alias}.${tieBreakerKey} ${op} :tieBreakerValue`, {
            tieBreakerValue
          }).orWhere(
            new Brackets((w2) => {
              w2.where(`${query.alias}.${tieBreakerKey} = :tieBreakerValue`, {
                tieBreakerValue
              }).andWhere(`${query.alias}.id ${op} :id`, { id });
            }),
          );
        }),
      );
  } else {
    // if there is only id return a page based on it
    query = query
      .orderBy(`${query.alias}_id`, order)
      .take(limit + 1)
      .andWhere(`${query.alias}.id ${op} :id`, { id });
  }
  let idRows: Entity[];
  try {
    idRows = await query.getMany();
  } catch (error) {
    if (isDataException(error)) {
      throw new InvalidCursorError();
    }

    throw error;
  }

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
