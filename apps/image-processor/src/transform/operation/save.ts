import { createWriteStream } from 'node:fs';
import { basename } from 'node:path';
import type { OutputInfo, Sharp } from 'sharp';

import { BeforeOutputEvent, OutputEvent } from '../events.js';
import { TransformOperation } from './operation.js';

export interface ImageSaveOperationArgs {
  path: string;
}

export class SaveOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageSaveOperationArgs): Sharp {
    const filename = basename(args.path);

    this.eventEmitter.emit('before-output', new BeforeOutputEvent(this.uuid));
    pipeline.once('info', (info: OutputInfo) => {
      this.eventEmitter.emit(
        'output',
        new OutputEvent(this.uuid, {
          path: args.path,
          filename,
          ...info,
        }),
      );
    });
    pipeline.pipe(createWriteStream(args.path));

    return pipeline;
  }
}
