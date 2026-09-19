import { FormProvider, useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog/Dialog.tsx';
import { ScrollArea } from 'src/components/ui/scroll-area/ScrollArea.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { LoaderCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DialogComponentProps } from 'src/lib/dialog-manager/registry.tsx';
import z from 'zod';
import { avatarUploadFormSchema } from 'src/components/features/forms/controllers/schema.ts';
import AvatarUploadForm from 'src/components/features/forms/avatar-upload/AvatarUploadForm.tsx';

function AvatarUploadDialog({
  open,
  onOpenChange,
  onOpenChangeComplete,
}: DialogComponentProps) {
  const form = useForm<z.infer<typeof avatarUploadFormSchema>>({
    resolver: zodResolver(avatarUploadFormSchema),
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
            <DialogTitle>Avatar</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-300px)]">
            <AvatarUploadForm onSuccess={() => onOpenChange(false)} />
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
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </FormProvider>
    </Dialog>
  );
}

export default AvatarUploadDialog;
