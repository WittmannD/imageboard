import type { FfmpegCommand } from '../ffmpeg-command.js';
import type { OperationContext } from './operation-context.js';
import type { OperationArgsMap } from './operation-map.js';

export interface Operation<K extends keyof OperationArgsMap> {
  process(
    command: FfmpegCommand,
    args: OperationArgsMap[K],
    context: OperationContext,
  ): void | Promise<void>;
}
