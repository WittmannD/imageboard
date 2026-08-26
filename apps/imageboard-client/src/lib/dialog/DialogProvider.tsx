import React, { type PropsWithChildren, useContext, useReducer } from 'react';
import { DialogContext } from 'src/lib/dialog/context.ts';
import { ALREADY_MOUNTED, DIALOG_REGISTRY } from 'src/lib/dialog/registry.ts';
import { reducer } from 'src/lib/dialog/store/reducer.ts';
import { setDispatch } from 'src/lib/dialog/store/actions.ts';

import type { DialogAction, DialogStore } from 'src/lib/dialog/types.ts';

// The placeholder component is used to auto render modals when call dialog.show()
// When dialog.show() is called, it means there've been modal info
export const DialogPlaceholder: React.FC = () => {
  const modals = useContext(DialogContext);
  const visibleModalIds = Object.keys(modals).filter((id) => !!modals[id]);
  visibleModalIds.forEach((id) => {
    if (!DIALOG_REGISTRY[id] && !ALREADY_MOUNTED[id]) {
      console.warn(
        `No dialog found for id: ${id}. Please check the id or if it is registered or declared via JSX.`,
      );
      return;
    }
  });

  const toRender = visibleModalIds
    .filter((id) => DIALOG_REGISTRY[id])
    .map((id) => ({
      id,
      ...DIALOG_REGISTRY[id],
    }));

  return (
    <>
      {toRender.map((t) =>
        t.comp ? <t.comp key={t.id} id={t.id} {...t.props} /> : null,
      )}
    </>
  );
};

const DefaultContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [dialogStore, dispatch] = useReducer(reducer, {});
  setDispatch(dispatch);

  return (
    <DialogContext.Provider value={dialogStore}>
      {children}
      <DialogPlaceholder />
    </DialogContext.Provider>
  );
};

/**
 * We can use DialogProvider with Redux store by passing dispatch and dialogs
 * props and register {@link reducer `reducer`}, otherwise default context will be used.
 */
export const DialogProvider: React.FC<Record<string, unknown>> = ({
  children,
  dispatch: givenDispatch,
  dialogs: givenDialogs,
}: PropsWithChildren<{
  dispatch?: React.Dispatch<DialogAction>;
  dialogs?: DialogStore;
}>) => {
  if (!givenDispatch || !givenDialogs) {
    return <DefaultContextProvider>{children}</DefaultContextProvider>;
  }
  setDispatch(givenDispatch);

  return (
    <DialogContext.Provider value={givenDialogs}>
      {children}
      <DialogPlaceholder />
    </DialogContext.Provider>
  );
};
