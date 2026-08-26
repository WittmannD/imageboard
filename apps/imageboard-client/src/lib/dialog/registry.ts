import React from 'react';

import type { DialogArgs } from './types.ts';

export type DialogCallbackRegistry = Record<string, {
    resolve: (args: unknown) => void;
    reject: (args: unknown) => void;
    promise: Promise<unknown>;
  } | undefined>;

export const DIALOG_REGISTRY: Record<string, {
    comp: React.FC<Record<string, unknown>>;
    props?: Record<string, unknown>;
  } | undefined> = {};

export const DIALOG_CALLBACK_REGISTRY: DialogCallbackRegistry = {};
export const DIALOG_HIDE_CALLBACK_REGISTRY: DialogCallbackRegistry = {};

export const DIALOG_QUERY_CONDITIONS_REGISTRY: Record<string, (qp: Record<string, string>) => boolean> = {};

export const ALREADY_MOUNTED: Record<string, boolean> = {};

// Get dialog component by dialog id
export const getDialog = (
  dialogId: string,
): React.FC<Record<string, unknown>> | undefined => {
  return DIALOG_REGISTRY[dialogId]?.comp;
};

// All registered dialogs will be rendered in dialog placeholder
export const register = <T extends React.FC<Record<string, unknown>>>(
  id: string,
  comp: T,
  props?: Partial<DialogArgs<T>>,
): void => {
  if (!DIALOG_REGISTRY[id]) {
    DIALOG_REGISTRY[id] = { comp, props };
  } else {
    DIALOG_REGISTRY[id].props = props;
  }
};

/**
 * Unregister a modal.
 * @param id - The id of the modal.
 */
export const unregister = (id: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete DIALOG_REGISTRY[id];
};
