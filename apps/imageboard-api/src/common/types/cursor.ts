import type { PickBranded, SortableTag } from './brands.js';

export type KeySetCursor<T> = Partial<PickBranded<T, SortableTag>> & {
  id: number;
};

export type KeySetOrder = 'ASC' | 'DESC';
