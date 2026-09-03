import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog/Dialog.tsx';
import CreatePostForm from 'src/components/features/forms/create-post-form/CreatePostForm.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostFormSchema } from 'src/components/features/forms/create-post-form/schema.ts';
import { ScrollArea } from 'src/components/ui/scroll-area/ScrollArea.tsx';
import { LoaderCircle } from 'lucide-react';
import type { DialogComponentProps } from 'src/lib/dialog-manager/registry.tsx';

function CreatePostDialog({
  open,
  onOpenChange,
  onOpenChangeComplete,
}: DialogComponentProps) {
  const form = useForm<z.infer<typeof createPostFormSchema>>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      caption: '',
      files: [],
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <FormProvider {...form}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-300px)]">
            <CreatePostForm onSuccess={() => onOpenChange(false)} />
          </ScrollArea>
          <DialogFooter showCloseButton={true}>
            <Button
              variant="default"
              disabled={form.formState.isSubmitting}
              form="create-post-form"
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </FormProvider>
    </Dialog>
  );
}

export default CreatePostDialog;
