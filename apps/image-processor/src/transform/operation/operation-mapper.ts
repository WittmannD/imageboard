import { AvifOperation } from './avif.js';
import { ExtendOperation } from './extend.js';
import { ExtractOperation } from './extract.js';
import { JpegOperation } from './jpeg.js';
import type { TransformOperation } from './operation.js';
import type { ImageTransformOptions } from './options.js';
import { PngOperation } from './png.js';
import { ResizeOperation } from './resize.js';
import { SaveOperation } from './save.js';
import { TrimOperation } from './trim.js';
import { WebpOperation } from './webp.js';

type OperationKind = ImageTransformOptions['operation'];

export class OperationMapper {
  getInstance(
    kind: OperationKind,
    ...args: ConstructorParameters<typeof TransformOperation>
  ) {
    switch (kind) {
      case 'resize':
        return new ResizeOperation(...args);
      case 'extend':
        return new ExtendOperation(...args);
      case 'extract':
        return new ExtractOperation(...args);
      case 'trim':
        return new TrimOperation(...args);
      case 'save':
        return new SaveOperation(...args);
      case 'webp':
        return new WebpOperation(...args);
      case 'jpeg':
        return new JpegOperation(...args);
      case 'png':
        return new PngOperation(...args);
      case 'avif':
        return new AvifOperation(...args);
    }
  }
}
