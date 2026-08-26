import DialogHoc from 'src/lib/dialog/DialogHoc.tsx';
import { useDialog } from 'src/lib/dialog/hooks/useDialog.ts';
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
import { baseUIDialog } from 'src/lib/dialog/factory.ts';

const CreatePostDialog = DialogHoc(() => {
  const form = useForm<z.infer<typeof createPostFormSchema>>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      caption: '',
      files: [],
    },
  });
  const dialog = useDialog();

  return (
    <Dialog {...baseUIDialog(dialog)}>
      <FormProvider {...form}>
        {/*<DialogTrigger></DialogTrigger>*/}
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-300px)]">
            <CreatePostForm />
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
});

export { CreatePostDialog };
