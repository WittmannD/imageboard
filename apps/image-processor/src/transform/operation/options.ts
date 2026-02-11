import type { ImageAvifOperationArgs } from './avif.js';
import type { ImageExtendOperationArgs } from './extend.js';
import type { ImageExtractOperationArgs } from './extract.js';
import type { ImageJpegOperationArgs } from './jpeg.js';
import type { ImagePngOperationArgs } from './png.js';
import type { ImageResizeOperationArgs } from './resize.js';
import type { ImageSaveOperationArgs } from './save.js';
import type { ImageTrimOperationArgs } from './trim.js';
import type { ImageWebpOperationArgs } from './webp.js';

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

export interface ImageWebpOperationOptions {
  operation: 'webp';
  args: ImageWebpOperationArgs;
  condition?: string;
}

export interface ImageJpegOperationOptions {
  operation: 'jpeg';
  args: ImageJpegOperationArgs;
  condition?: string;
}

export interface ImagePngOperationOptions {
  operation: 'png';
  args: ImagePngOperationArgs;
  condition?: string;
}

export interface ImageAvifOperationOptions {
  operation: 'avif';
  args: ImageAvifOperationArgs;
  condition?: string;
}

export type ImageTransformOptions =
  | ImageResizeOperationOptions
  | ImageExtendOperationOptions
  | ImageExtractOperationOptions
  | ImageTrimOperationOptions
  | ImageSaveOperationOptions
  | ImageWebpOperationOptions
  | ImageJpegOperationOptions
  | ImagePngOperationOptions
  | ImageAvifOperationOptions;

export type NestedTransformOperation =
  | ImageTransformOptions
  | readonly NestedTransformOperation[];
export type NestedTransformOperations = readonly NestedTransformOperation[];
