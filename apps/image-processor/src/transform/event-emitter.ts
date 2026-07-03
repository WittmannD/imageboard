import { EventEmitter } from 'node:events';

import { BeforeOutputEvent, EndEvent, OutputEvent } from './events.js';

interface EventMap {
  'before-output': [BeforeOutputEvent];
  output: [OutputEvent];
  end: [EndEvent];
  error: [ErrorEvent];
}

export class ImageTransformerEventEmitter extends EventEmitter<EventMap> {}
