import { Brackets, type SelectQueryBuilder } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BaseEntity } from '../entity/base.entity.js';
import type { KeySetCursor } from '../types/cursor.js';
import { paginate } from './paginate.js';

describe('paginate', () => {
  // eslint-disable-next-line
  let qb: any;

  const createMockQB = (rows: unknown[]) => {
    return {
      alias: 'entity',
      addSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(rows),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return first page when no cursor', async () => {
    const limit = 2;
    qb = createMockQB([{ id: 3 }, { id: 2 }, { id: 1 }]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      undefined,
      { limit },
    );

    expect(qb.orderBy).toHaveBeenCalledWith('_id', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(limit + 1);

    expect(result).toEqual({
      ids: [3, 2],
      hasNextPage: true,
      nextCursor: { id: 2 },
    });
  });

  it('should paginate using id cursor only', async () => {
    const cursor = { id: 10 };

    qb = createMockQB([{ id: 5 }, { id: 4 }]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      cursor,
      { limit: 2 },
    );

    expect(qb.andWhere).toHaveBeenCalledWith('_id < :id', { id: cursor.id });

    expect(result).toEqual({
      ids: [5, 4],
      hasNextPage: false,
      nextCursor: null,
    });
  });

  it('should paginate with tie-breaker', async () => {
    const cursor = {
      id: 4,
      createdAt: new Date(2026, 0, 1, 12, 2),
    } as KeySetCursor<BaseEntity>;
    const nextCursor = { id: 2, createdAt: new Date(2026, 0, 1, 12, 1) };

    qb = createMockQB([
      { id: 3, createdAt: new Date(2026, 0, 1, 12, 2) },
      nextCursor,
      { id: 1, createdAt: new Date(2026, 0, 1, 12, 1) },
    ]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      cursor,
      { limit: 2 },
    );

    expect(qb.addSelect).toHaveBeenCalledWith(
      'entity.createdAt',
      '_tieBreaker',
    );
    expect(qb.orderBy).toHaveBeenCalledWith('_tieBreaker', 'DESC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('_id', 'DESC');

    expect(qb.andWhere).toHaveBeenCalled();
    const whereArg = qb.andWhere.mock.calls[0][0];
    expect(whereArg).toBeInstanceOf(Brackets);

    expect(result).toEqual({
      ids: [3, 2],
      hasNextPage: true,
      nextCursor,
    });
  });

  it('should sort in ascending order', async () => {
    const order = 'ASC';
    const cursor = {
      id: 0,
      createdAt: new Date(2026, 0, 1, 12, 0),
    } as KeySetCursor<BaseEntity>;
    const nextCursor = { id: 2, createdAt: new Date(2026, 0, 1, 12, 2) };

    qb = createMockQB([
      { id: 3, createdAt: new Date(2026, 0, 1, 12, 2) },
      nextCursor,
      { id: 1, createdAt: new Date(2026, 0, 1, 12, 1) },
    ]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      cursor,
      { limit: 2, order },
    );

    expect(qb.orderBy).toHaveBeenCalledWith('_tieBreaker', order);
    expect(qb.addOrderBy).toHaveBeenCalledWith('_id', order);

    expect(result).toEqual({
      ids: [3, 2],
      hasNextPage: true,
      nextCursor,
    });
  });

  it('should return empty result correctly', async () => {
    qb = createMockQB([]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      {},
      { limit: 2 },
    );

    expect(result).toEqual({
      ids: [],
      hasNextPage: false,
      nextCursor: null,
    });
  });

  it('should not set nextCursor if no next page', async () => {
    qb = createMockQB([{ id: 2 }, { id: 1 }]);

    const result = await paginate(
      qb as SelectQueryBuilder<BaseEntity>,
      {},
      { limit: 2 },
    );

    expect(result).toEqual({
      ids: [2, 1],
      hasNextPage: false,
      nextCursor: null,
    });
  });
});
