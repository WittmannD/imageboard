import { cva } from 'class-variance-authority';

const dropzoneAreaVariants = cva(
  'flex items-center justify-center text-center w-full rounded-lg border-1 border-input bg-transparent p-2.5 text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      state: {
        idle: 'bg-transparent dark:bg-input/30 border-input',
        dragover: 'bg-accent/10 dark:bg-accent/10 border-accent/50',
      },
    },
    defaultVariants: {
      state: 'idle',
    },
  },
);

export { dropzoneAreaVariants };
