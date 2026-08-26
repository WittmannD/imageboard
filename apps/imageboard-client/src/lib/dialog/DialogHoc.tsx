import React, { useContext, useEffect, useMemo } from 'react';
import { useDialog } from 'src/lib/dialog/hooks/useDialog.ts';
import {
  DialogContext,
  DialogIdContext,
} from 'src/lib/dialog/context.ts';
import { ALREADY_MOUNTED } from 'src/lib/dialog/registry.ts';
import { setFlags } from 'src/lib/dialog/store/actions.ts';
import { DialogID, type FCWithID } from 'src/lib/dialog/helpers.ts';

export interface DialogHocProps {
  id: string;
  defaultVisible?: boolean;
  keepMounted?: boolean;
}

const DialogHoc = <P extends object>(
  Comp: React.ComponentType<P>,
): FCWithID<P & DialogHocProps> => {
  const Extended = ({ defaultVisible, keepMounted, id, ...props }: P & DialogHocProps) => {
    const { args, show } = useDialog(id, {});

    // If there's modal state, then should mount it.
    const dialogStore = useContext(DialogContext);
    const shouldMount = !!dialogStore[id];

    useEffect(() => {
      // If defaultVisible, show it after mounted.
      if (defaultVisible) {
        show();
      }

      ALREADY_MOUNTED[id] = true;

      return () => {
        delete ALREADY_MOUNTED[id];
      };
    }, [id, show, defaultVisible]);

    useEffect(() => {
      if (keepMounted) setFlags(id, { keepMounted: true });
    }, [id, keepMounted]);

    const delayVisible = dialogStore[id]?.delayVisible;
    // If modal.show is called
    //  1. If modal was mounted, should make it visible directly
    //  2. If modal has not been mounted, should mount it first, then make it visible
    useEffect(() => {
      if (delayVisible) {
        // delayVisible: false => true, it means the modal.show() is called, should show it.
        show(args);
      }
    }, [delayVisible, args, show]);

    const componentProps = useMemo<P>(() => ({
      ...props,
      ...(args as Partial<P> | undefined),
    } as P), [props, args]);

    if (!shouldMount) return null;
    return (
      <DialogIdContext.Provider value={id}>
        <Comp {...componentProps} />
      </DialogIdContext.Provider>
    );
  };
  return Object.defineProperty(Extended, DialogID, { writable: true }) as FCWithID<P & DialogHocProps>;
};

export default DialogHoc;
