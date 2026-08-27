import React from 'react';
import { v4 as uuidv4 } from 'uuid';

export const DialogID = Symbol('__dialog_id__');
export type FCWithID<P> = React.FC<P> & { [DialogID]: string };

export const getDialogId = (
  dialog: string | FCWithID<Record<string, unknown>>,
): string => {
  if (typeof dialog === 'string') return dialog;

  if (!dialog[DialogID]) {
    dialog[DialogID] = uuidv4();
  }
  return dialog[DialogID];
};
