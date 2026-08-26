import React from 'react';
import { type FCWithID, getDialogId } from 'src/lib/dialog/helpers.ts';
import {
  DIALOG_CALLBACK_REGISTRY,
  DIALOG_HIDE_CALLBACK_REGISTRY,
  DIALOG_REGISTRY,
  register,
} from 'src/lib/dialog/registry.ts';
import type { DialogAction, DialogArgs } from 'src/lib/dialog/types.ts';

let dispatch: React.Dispatch<DialogAction> = () => {
  throw new Error(
    'No dispatch method detected, did you embed your app with NiceDialog.Provider?',
  );
};

export const setDispatch = (newDispatch: React.Dispatch<DialogAction>) => {
  dispatch = newDispatch;
}

// action creator to show a dialog
function showDialog(
  dialogId: string,
  args?:
    Record<string, unknown>  ,
): DialogAction {
  return {
    type: 'nice-dialog/show',
    payload: {
      dialogId,
      args,
    },
  };
}

// action creator to set flags of a dialog
function setDialogFlags(
  dialogId: string,
  flags: Record<string, unknown>,
): DialogAction {
  return {
    type: 'nice-dialog/set-flags',
    payload: {
      dialogId,
      flags,
    },
  };
}
// action creator to hide a dialog
function hideDialog(dialogId: string): DialogAction {
  return {
    type: 'nice-dialog/hide',
    payload: {
      dialogId,
    },
  };
}

// action creator to remove a dialog
function removeDialog(dialogId: string): DialogAction {
  return {
    type: 'nice-dialog/remove',
    payload: {
      dialogId,
    },
  };
}

export function show<
  T extends Record<string, unknown>,
  C extends Record<string, unknown>,
>(dialog: FCWithID<C>, args?: Partial<DialogArgs<React.FC<C>>>): Promise<T>;

export function show<T extends Record<string, unknown>>(
  dialog: string,
  args?: Record<string, unknown>,
): Promise<T>;
export function show<T extends Record<string, unknown>>(
  dialog: string,
  args: Record<string, unknown>,
): Promise<T>;

export function show(
  dialog: FCWithID<Record<string, unknown>> | string,
  args?:
    DialogArgs<React.FC<Record<string, unknown>>>  ,
) {
  const dialogId = getDialogId(dialog);
  if (typeof dialog !== 'string' && !DIALOG_REGISTRY[dialogId]) {
    register(dialogId, dialog);
  }

  dispatch(showDialog(dialogId, args));
  if (!DIALOG_CALLBACK_REGISTRY[dialogId]) {
    // `!` tell ts that theResolve will be written before it is used
    let theResolve!: (args?: unknown) => void;
    // `!` tell ts that theResolve will be written before it is used
    let theReject!: (args?: unknown) => void;
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve;
      theReject = reject;
    });
    DIALOG_CALLBACK_REGISTRY[dialogId] = {
      resolve: theResolve,
      reject: theReject,
      promise,
    };
  }
  return DIALOG_CALLBACK_REGISTRY[dialogId].promise;
}

export function hide<T>(
  dialog: string | FCWithID<Record<string, unknown>>,
): Promise<T>;
export function hide(
  dialog: string | FCWithID<Record<string, unknown>>,
): Promise<unknown> {
  const dialogId = getDialogId(dialog);
  dispatch(hideDialog(dialogId));
  // Should also delete the callback for dialog.resolve #35
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete DIALOG_CALLBACK_REGISTRY[dialogId];
  if (!DIALOG_HIDE_CALLBACK_REGISTRY[dialogId]) {
    // `!` tell ts that theResolve will be written before it is used
    let theResolve!: (args?: unknown) => void;
    // `!` tell ts that theResolve will be written before it is used
    let theReject!: (args?: unknown) => void;
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve;
      theReject = reject;
    });
    DIALOG_HIDE_CALLBACK_REGISTRY[dialogId] = {
      resolve: theResolve,
      reject: theReject,
      promise,
    };
  }
  return DIALOG_HIDE_CALLBACK_REGISTRY[dialogId].promise;
}

export const remove = (dialog: string | FCWithID<Record<string, unknown>>): void => {
  const dialogId = getDialogId(dialog);
  dispatch(removeDialog(dialogId));
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete DIALOG_CALLBACK_REGISTRY[dialogId];
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete DIALOG_HIDE_CALLBACK_REGISTRY[dialogId];
};

export const setFlags = (dialogId: string, flags: Record<string, unknown>): void => {
  dispatch(setDialogFlags(dialogId, flags));
};
