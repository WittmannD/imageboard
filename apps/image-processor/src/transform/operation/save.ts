import { basename } from 'node:path';
import type { OutputInfo, Sharp } from 'sharp';

import { BeforeOutputEvent, OutputEvent } from '../events.js';
import { TransformOperation } from './operation.js';

export interface ImageSaveOperationArgs {
  key: string;
}

export class SaveOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageSaveOperationArgs): Sharp {
    const filename = basename(args.key);

    this.eventEmitter.emit('before-output', new BeforeOutputEvent(this.uuid));
    pipeline.once('info', (info: OutputInfo) => {
      this.eventEmitter.emit(
        'output',
        new OutputEvent(this.uuid, {
          key: args.key,
          filename,
          ...info,
        }),
      );
    });
    pipeline.pipe(this.outputFactory(args.key));

    return pipeline;
  }
}
