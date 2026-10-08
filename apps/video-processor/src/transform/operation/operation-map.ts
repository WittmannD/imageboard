import { CropOperation, type VideoCropOperationArgs } from './crop.js';
import { FpsOperation, type VideoFpsOperationArgs } from './fps.js';
import { FrameOperation, type VideoFrameOperationArgs } from './frame.js';
import { H264Operation, type VideoH264OperationArgs } from './h264.js';
import { MuteOperation, type VideoMuteOperationArgs } from './mute.js';
import type { Operation } from './operation.js';
import { SaveOperation, type VideoSaveOperationArgs } from './save.js';
import { ScaleOperation, type VideoScaleOperationArgs } from './scale.js';
import { TrimOperation, type VideoTrimOperationArgs } from './trim.js';
import { type VideoVp9OperationArgs, Vp9Operation } from './vp9.js';

// This map is the main interface for further adding operation types.
// Adding a new field here will allow adding a new operation.
// This should be done strictly in this way; so TypeScript can associate the type of
// arguments with the interface of the operation itself in mapped types.
// https://github.com/microsoft/TypeScript/pull/47109
export interface OperationArgsMap {
  crop: VideoCropOperationArgs;
  fps: VideoFpsOperationArgs;
  frame: VideoFrameOperationArgs;
  h264: VideoH264OperationArgs;
  mute: VideoMuteOperationArgs;
  save: VideoSaveOperationArgs;
  scale: VideoScaleOperationArgs;
  trim: VideoTrimOperationArgs;
  vp9: VideoVp9OperationArgs;
}

export interface OperationConfig<
  K extends keyof OperationArgsMap = keyof OperationArgsMap,
> {
  operation: K;
  args: OperationArgsMap[K];
}

export type OperationNestedConfig =
  OperationConfig | readonly OperationNestedConfig[];
export type OperationNestedConfigs = readonly OperationNestedConfig[];

export type OperationMap = { [K in keyof OperationArgsMap]: Operation<K> };

export const operationMap: OperationMap = {
  crop: CropOperation,
  fps: FpsOperation,
  frame: FrameOperation,
  h264: H264Operation,
  mute: MuteOperation,
  save: SaveOperation,
  scale: ScaleOperation,
  trim: TrimOperation,
  vp9: Vp9Operation,
};
