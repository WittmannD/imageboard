import type { DialogHandler } from 'src/lib/dialog/types.ts';

export const bootstrapDialog = (
  dialog: DialogHandler,
): { show: boolean; onHide: () => void; onExited: () => void } => {
  return {
    show: dialog.visible,
    onHide: () => void dialog.hide(),
    onExited: () => {
      dialog.resolveHide();
      if(!dialog.keepMounted) dialog.remove();
    },
  };
};

export const baseUIDialog = (
  dialog: DialogHandler,
): {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
} => {
  return {
    open: dialog.visible,
    onOpenChange: (open) => {
      if (open) return;
      void dialog.hide()
    },
    onOpenChangeComplete: (open) => {
      if (open) return;
      dialog.resolveHide();
      if (!dialog.keepMounted) dialog.remove();
    },
  };
};
