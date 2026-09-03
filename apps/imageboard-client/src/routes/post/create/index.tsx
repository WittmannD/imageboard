import { FormProvider, useForm } from 'react-hook-form';
import CreatePostForm from 'src/components/features/forms/create-post-form/CreatePostForm.tsx';
import { Button } from 'src/components/ui/button/Button.tsx';
import { LoaderCircle } from 'lucide-react';
import { createPostFormSchema } from 'src/components/features/forms/create-post-form/schema.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card/Card.tsx';

function CreatePostPage() {
  const form = useForm<z.infer<typeof createPostFormSchema>>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      caption: '',
      files: [],
    },
  });

  return (
    <div className="min-h-[calc(100svh-var(--header-height))] py-8 flex items-center justify-center">
      <FormProvider {...form}>
        <Card size="default" className="mx-auto w-full max-w-xl">
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <CreatePostForm />
          </CardContent>
          <CardFooter>
            <Button
              size="lg"
              className="w-full"
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
          </CardFooter>
        </Card>
      </FormProvider>
    </div>
  );
}

export default CreatePostPage;
