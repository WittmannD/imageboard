import type { ImageExtendOperationArgs } from './extend.js';
import type { ImageExtractOperationArgs } from './extract.js';
import type { ImageResizeOperationArgs } from './resize.js';
import type { ImageSaveOperationArgs } from './save.js';
import type { ImageTrimOperationArgs } from './trim.js';

export interface ImageExtendOperationOptions {
  operation: 'extend';
  args: ImageExtendOperationArgs;
  condition?: string;
}

export interface ImageExtractOperationOptions {
  operation: 'extract';
  args: ImageExtractOperationArgs;
  condition?: string;
}

export interface ImageResizeOperationOptions {
  operation: 'resize';
  args: ImageResizeOperationArgs;
  condition?: string;
}

export interface ImageTrimOperationOptions {
  operation: 'trim';
  args: ImageTrimOperationArgs;
  condition?: string;
}

export interface ImageSaveOperationOptions {
  operation: 'save';
  args: ImageSaveOperationArgs;
  condition?: string;
}

export type ImageTransformOptions =
  | ImageResizeOperationOptions
  | ImageExtendOperationOptions
  | ImageExtractOperationOptions
  | ImageTrimOperationOptions
  | ImageSaveOperationOptions;

export type NestedTransformOperations =
  | ImageTransformOptions[]
  | ImageTransformOptions[][];
