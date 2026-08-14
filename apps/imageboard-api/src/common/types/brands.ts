declare const __brand: unique symbol;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Brand<Tag> = { readonly [__brand]: Tag };
export type Branded<T, Tag> = T & Brand<Tag>;
export type UnwrapBranded<T> = T extends Branded<infer U, unknown> ? U : never;
export type PickBranded<T, Tag> = {
  [K in keyof T as T[K] extends Brand<Tag> ? K : never]: T[K];
};

export type SortableTag = 'Sortable';
export type Sortable<T> = Branded<T, SortableTag>;
