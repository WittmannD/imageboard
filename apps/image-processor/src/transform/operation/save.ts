import { basename } from 'node:path';
import type { OutputInfo, Sharp } from 'sharp';

import { BeforeOutputEvent, ErrorEvent,OutputEvent } from '../events.js';
import type { Operation } from './operation.js';
import type { OperationContext } from './operation-context.js';

export interface ImageSaveOperationArgs {
  key: string;
}

export const SaveOperation: Operation<'save'> = {
  process(
    pipeline: Sharp,
    args: ImageSaveOperationArgs,
    context: OperationContext,
  ): Sharp {
    const filename = basename(args.key);

    context.eventEmitter.emit(
      'before-output',
      new BeforeOutputEvent(context.uuid),
    );
    pipeline.once('info', (info: OutputInfo) => {
      context.eventEmitter.emit(
        'output',
        new OutputEvent(context.uuid, {
          key: args.key,
          filename,
          ...info,
        }),
      );
    });
    context.storage
      .upload({ key: args.key, body: pipeline })
      .then()
      .catch((error: unknown) => {
        context.eventEmitter.emit(
          'error',
          new ErrorEvent(context.uuid, error as Error),
        );
      });
    return pipeline;
  },
};
