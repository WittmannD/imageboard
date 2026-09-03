import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import type { ModalData } from 'src/routes/layout.tsx';
import { dialogRegistry, type DialogName } from './registry.tsx';
import { encodeDialogParams } from './params.ts';

export interface DialogManagerContextValue {
  openDialog: (name: DialogName, params?: object) => void;
  closeDialog: () => void;
}

const DialogManagerContext = createContext<DialogManagerContextValue | null>(
  null,
);

export function useDialogManager(): DialogManagerContextValue {
  const context = useContext(DialogManagerContext);
  if (!context) {
    throw new Error(
      'useDialogManager must be used within a DialogManagerProvider',
    );
  }
  return context;
}

interface MountedDialog {
  name: DialogName;
  params: object;
}

function isDialogName(name: string | null): name is DialogName {
  return !!name && name in dialogRegistry;
}

export function DialogManagerProvider({ children }: PropsWithChildren) {
  const modal = useLoaderData<ModalData>() ?? {};
  const [, setSearchParams] = useSearchParams();
  const [mounted, setMounted] = useState<MountedDialog | null>(null);

  useEffect(() => {
    if (isDialogName(modal.name)) {
      setMounted({ name: modal.name, params: modal.params ?? {} });
    }
  }, [modal.name, modal.params]);

  const open = isDialogName(modal.name) && mounted?.name === modal.name;

  const openDialog = useCallback(
    (name: DialogName, params?: object) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('modal', name);
        if (params) {
          next.set('params', encodeDialogParams(params));
        } else {
          next.delete('params');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const closeDialog = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('modal');
        next.delete('params');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeDialog();
    },
    [closeDialog],
  );

  const handleOpenChangeComplete = useCallback((next: boolean) => {
    if (!next) setMounted(null);
  }, []);

  const value = useMemo<DialogManagerContextValue>(
    () => ({ openDialog, closeDialog }),
    [openDialog, closeDialog],
  );

  const ActiveDialog = mounted ? dialogRegistry[mounted.name] : null;

  return (
    <DialogManagerContext.Provider value={value}>
      {children}
      {ActiveDialog && mounted && (
        <Suspense fallback={null}>
          <ActiveDialog
            params={mounted.params}
            open={open}
            onOpenChange={handleOpenChange}
            onOpenChangeComplete={handleOpenChangeComplete}
          />
        </Suspense>
      )}
    </DialogManagerContext.Provider>
  );
}
