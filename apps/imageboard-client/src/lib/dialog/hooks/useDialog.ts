import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import {
  DialogContext,
  DialogIdContext,
} from 'src/lib/dialog/context.ts';
import { type FCWithID, getDialogId } from 'src/lib/dialog/helpers.ts';
import {
  DIALOG_CALLBACK_REGISTRY,
  DIALOG_HIDE_CALLBACK_REGISTRY,
  DIALOG_REGISTRY,
  register,
} from 'src/lib/dialog/registry.ts';
import { hide, remove, show } from 'src/lib/dialog/store/actions.ts';
import type {
  DialogArgs,
  DialogHandler,
} from 'src/lib/dialog/types.ts';

export function useDialog(): DialogHandler;
export function useDialog(
  dialog: string,
  args: Record<string, unknown>,
): DialogHandler;
export function useDialog<
  C extends object,
  P extends Partial<DialogArgs<React.FC<C>>>,
>(
  dialog: FCWithID<C>,
  args?: P,
): Omit<DialogHandler, 'show' | 'args'> & {
  args: P;
  show: (args?: P) => Promise<unknown>;
};

export function useDialog(
  dialog?: string | FCWithID<object>,
  args?: DialogArgs<React.FC<object>>,
): unknown {
  const dialogStore = useContext(DialogContext);
  const contextDialogId = useContext(DialogIdContext);
  let dialogId: string | null = null;

  const isUseComponent = dialog && typeof dialog !== 'string';

  if (!dialog) {
    dialogId = contextDialogId;
  } else {
    dialogId = getDialogId(dialog);
  }

  // Only if contextModalId doesn't exist
  if (!dialogId) throw new Error('No modal id found in NiceModal.useDialog.');

  // If use a component directly, register it.
  useEffect(() => {
    if (isUseComponent && !(dialogId in DIALOG_REGISTRY)) {
      register(dialogId, dialog, args);
    }
  }, [isUseComponent, dialogId, dialog, args]);

  const dialogInfo = dialogStore[dialogId];

  const showCallback = useCallback(
    (args?: Record<string, unknown>) => show(dialogId, args),
    [dialogId],
  );
  const hideCallback = useCallback(() => hide(dialogId), [dialogId]);
  const removeCallback = useCallback(() => { remove(dialogId); }, [dialogId]);
  const resolveCallback = useCallback(
    (args?: unknown) => {
      DIALOG_CALLBACK_REGISTRY[dialogId]?.resolve(args);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete DIALOG_CALLBACK_REGISTRY[dialogId];
    },
    [dialogId],
  );
  const rejectCallback = useCallback(
    (args?: unknown) => {
      DIALOG_CALLBACK_REGISTRY[dialogId]?.reject(args);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete DIALOG_CALLBACK_REGISTRY[dialogId];
    },
    [dialogId],
  );
  const resolveHide = useCallback(
    (args?: unknown) => {
      DIALOG_HIDE_CALLBACK_REGISTRY[dialogId]?.resolve(args);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete DIALOG_HIDE_CALLBACK_REGISTRY[dialogId];
    },
    [dialogId],
  );

  return useMemo(
    () => ({
      id: dialogId,
      args: dialogInfo?.args,
      visible: !!dialogInfo?.visible,
      keepMounted: !!dialogInfo?.keepMounted,
      show: showCallback,
      hide: hideCallback,
      remove: removeCallback,
      resolve: resolveCallback,
      reject: rejectCallback,
      resolveHide,
    }),
    [
      dialogId,
      dialogInfo?.args,
      dialogInfo?.visible,
      dialogInfo?.keepMounted,
      showCallback,
      hideCallback,
      removeCallback,
      resolveCallback,
      rejectCallback,
      resolveHide,
    ],
  );
}