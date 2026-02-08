import { basename } from 'node:path';
import type { Sharp } from 'sharp';

import { BeforeOutputEvent, OutputEvent } from '../events.js';
import { TransformOperation } from './operation.js';

export interface ImageSaveOperationArgs {
  path: string;
}

export class SaveOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ImageSaveOperationArgs): Sharp {
    const filename = basename(args.path);

    this.eventEmitter.emit(OutputEvent.name, new BeforeOutputEvent(this.uuid));
    void pipeline
      .toFile(args.path)
      .then((outputInfo) => {
        this.eventEmitter.emit(
          'output',
          new OutputEvent(this.uuid, {
            path: args.path,
            filename,
            ...outputInfo,
          }),
        );
      })
      .catch();

    return pipeline;
  }
}
