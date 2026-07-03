import  { AvifOperation, type ImageAvifOperationArgs } from './avif.js';
import  { ExtendOperation, type ImageExtendOperationArgs } from './extend.js';
import  { ExtractOperation, type ImageExtractOperationArgs } from './extract.js';
import  { type ImageJpegOperationArgs, JpegOperation } from './jpeg.js';
import type { Operation } from './operation.js';
import  { type ImagePngOperationArgs, PngOperation } from './png.js';
import  { type ImageResizeOperationArgs, ResizeOperation } from './resize.js';
import  { type ImageSaveOperationArgs, SaveOperation } from './save.js';
import  { type ImageTrimOperationArgs, TrimOperation } from './trim.js';
import  { type ImageWebpOperationArgs, WebpOperation } from './webp.js';

// This map is the main interface for further typing of operations.
// Adding a new field here will allow adding a new operation.
// This should be done strictly in this way; so TypeScript can associate the type of
// arguments with the interface of the operation itself in mapped types.
// https://github.com/microsoft/TypeScript/pull/47109
export interface OperationArgsMap {
  avif: ImageAvifOperationArgs;
  extend: ImageExtendOperationArgs;
  extract: ImageExtractOperationArgs;
  jpeg: ImageJpegOperationArgs;
  png: ImagePngOperationArgs;
  resize: ImageResizeOperationArgs;
  save: ImageSaveOperationArgs;
  trim: ImageTrimOperationArgs;
  webp: ImageWebpOperationArgs;
}

export interface OperationConfig<K extends keyof OperationArgsMap = keyof OperationArgsMap> {
  operation: K,
  args: OperationArgsMap[K],
  condition?: boolean,
}

export type OperationNestedConfig =
  | OperationConfig
  | readonly OperationNestedConfig[];
export type OperationNestedConfigs = readonly OperationNestedConfig[]

export type OperationMap = { [K in keyof OperationArgsMap]: Operation<K> };

export const operationMap: OperationMap = {
  avif: AvifOperation,
  extend: ExtendOperation,
  extract: ExtractOperation,
  jpeg: JpegOperation,
  png: PngOperation,
  resize: ResizeOperation,
  save: SaveOperation,
  trim: TrimOperation,
  webp: WebpOperation,
};
