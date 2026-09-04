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
  getDialogSearchParams: (name: DialogName, params?: object) => string;
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
  const modal = useLoaderData<ModalData | undefined>();
  const [, setSearchParams] = useSearchParams();
  const [mounted, setMounted] = useState<MountedDialog | null>(null);

  useEffect(() => {
    if (modal && isDialogName(modal.name)) {
      setMounted({ name: modal.name, params: modal.params ?? {} });
    }
  }, [modal]);

  const open = Boolean(modal && isDialogName(modal.name) && mounted?.name === modal.name);

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

  const getDialogSearchParams = useCallback(
    (name: DialogName, params?: object) => {
      const searchParams = new URLSearchParams();
      searchParams.set('modal', name);
      if (params) {
        searchParams.set('params', encodeDialogParams(params));
      }
      return searchParams.toString();
    },
    []
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
    () => ({ openDialog, getDialogSearchParams, closeDialog }),
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
