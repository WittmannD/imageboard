import type { Sharp } from 'sharp';

import type { OperationContext } from './operation-context.js';
import type { OperationArgsMap } from './operation-map.js';

export interface Operation<K extends keyof OperationArgsMap> {
  process(
    pipeline: Sharp,
    args: OperationArgsMap[K],
    context: OperationContext,
  ): Sharp | Promise<Sharp>;
}
