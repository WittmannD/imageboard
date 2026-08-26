import React from 'react';

export const DialogID = Symbol('__dialog_id__');
export type FCWithID<P> = React.FC<P> & { [DialogID]: string };

export const getDialogId = (
  dialog: string | FCWithID<Record<string, unknown>>,
): string => {
  if (typeof dialog === 'string') return dialog;

  if (!dialog[DialogID]) {
    dialog[DialogID] = crypto.randomUUID();
  }
  return dialog[DialogID];
};
