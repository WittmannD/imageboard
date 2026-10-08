import type { StorageDriver } from '@hdotu1/media-storage/drivers';

import type { Ffmpeg } from '../ffmpeg/ffmpeg.js';
import { FfmpegCommand } from './ffmpeg-command.js';
import type { OperationContext } from './operation/operation-context.js';
import {
  type OperationArgsMap,
  type OperationConfig,
  operationMap,
  type OperationNestedConfig,
  type OperationNestedConfigs,
} from './operation/operation-map.js';
import type { FileOutputInfo } from './output.js';

/**
 * Applies the operations to a ffmpeg command. A nested array works on a fork
 * of the command, so its operations do not leak into the rest; every `save`
 * renders the command it is applied to into one output.
 */
export class VideoTransformer {
  constructor(
    private readonly operationConfig: OperationNestedConfigs,
    private readonly ffmpeg: Ffmpeg,
    private readonly storage: StorageDriver,
  ) {}

  private isOperationArray(
    operations: OperationNestedConfig,
  ): operations is readonly OperationNestedConfig[] {
    return Array.isArray(operations);
  }

  private async executeOperation<K extends keyof OperationArgsMap>(
    command: FfmpegCommand,
    config: OperationConfig<K>,
    context: OperationContext,
  ) {
    await operationMap[config.operation].process(command, config.args, context);
  }

  private async applyOperations(
    command: FfmpegCommand,
    configs: OperationNestedConfigs,
    context: OperationContext,
  ) {
    for (const configOrArray of configs) {
      if (this.isOperationArray(configOrArray)) {
        await this.applyOperations(command.clone(), configOrArray, context);
        continue;
      }

      await this.executeOperation(command, configOrArray, context);
    }
  }

  /**
   * @param input local path of the source video
   * @param workDir scratch directory for the rendered files
   */
  async transform(input: string, workDir: string): Promise<FileOutputInfo[]> {
    const outputs: FileOutputInfo[] = [];
    const context: OperationContext = {
      ffmpeg: this.ffmpeg,
      storage: this.storage,
      input,
      workDir,
      addOutput: (output) => {
        outputs.push(output);
      },
    };

    await this.applyOperations(
      new FfmpegCommand(),
      this.operationConfig,
      context,
    );

    return outputs;
  }
}
