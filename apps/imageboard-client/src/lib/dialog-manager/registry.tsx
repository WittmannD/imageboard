import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface DialogComponentProps<Params extends object = object> {
  params: Params;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
}

export const dialogRegistry = {
  'create-post': lazy(
    () => import('src/components/features/dialogs/CreatePostDialog.tsx'),
  ),
  'post': lazy(() => import('src/components/features/dialogs/PostDialog.tsx')),
} satisfies Record<string, LazyExoticComponent<ComponentType<any>>>;

export type DialogName = keyof typeof dialogRegistry;
