import type {
  ExtendOptions,
  Region,
  ResizeOptions,
  Sharp,
  TrimOptions,
} from 'sharp';

export interface ImageResizeOperationOptions {
  operation: 'resize';
  args: ResizeOptions;
  condition: string;
}

export interface ImageExtendOperationOptions {
  operation: 'extend';
  args: ExtendOptions;
  condition: string;
}

export interface ImageExtractOperationOptions {
  operation: 'extract';
  args: Region;
  condition: string;
}

export interface ImageTrimOperationOptions {
  operation: 'trim';
  args: TrimOptions;
  condition: string;
}

export type ImageTransformOptions =
  | ImageResizeOperationOptions
  | ImageExtendOperationOptions
  | ImageExtractOperationOptions
  | ImageTrimOperationOptions;

export abstract class TransformOperation {
  abstract process(pipeline: Sharp, args: ImageTransformOptions['args']): Sharp;
}

export class ResizeOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ResizeOptions): Sharp {
    return pipeline.resize(args);
  }
}

export class ExtendOperation extends TransformOperation {
  override process(pipeline: Sharp, args: ExtendOptions): Sharp {
    return pipeline.extend(args);
  }
}

export class ExtractOperation extends TransformOperation {
  override process(pipeline: Sharp, args: Region): Sharp {
    return pipeline.extract(args);
  }
}

export class TrimOperation extends TransformOperation {
  override process(pipeline: Sharp, args: TrimOptions): Sharp {
    return pipeline.trim(args);
  }
}

export class OperationMapper {
  get(operationKey: ImageTransformOptions['operation']) {
    switch (operationKey) {
      case 'resize':
        return new ResizeOperation();
      case 'extend':
        return new ExtendOperation();
      case 'extract':
        return new ExtractOperation();
      case 'trim':
        return new TrimOperation();
    }
  }
}
