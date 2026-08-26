import React from 'react';
import type {
  DialogStore,
} from 'src/lib/dialog/types.ts';

export const DialogContext = React.createContext<DialogStore>({});
export const DialogIdContext = React.createContext<string | null>(null);
