import { Skeleton } from 'src/components/ui/skeleton/Skeleton.tsx';
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'src/lib/utils/cn.ts';

export const userBadgeVariants = cva('flex w-fit items-center gap-1 group', {
  variants: {
    size: {
      sm: '*:data-[slot=skeleton-avatar]:size-6 *:data-[slot=skeleton-username]:h-4',
      default:
        '*:data-[slot=skeleton-avatar]:size-8 *:data-[slot=skeleton-username]:h-4',
      lg: '*:data-[slot=skeleton-avatar]:size-10 *:data-[slot=skeleton-username]:h-6',
    },
  },
});

export function UserBadgeSkeleton({
  size = 'default',
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof userBadgeVariants>) {
  return (
    <div className={cn(userBadgeVariants({ size, className }))} {...props}>
      <Skeleton
        className="size-8 shrink-0 rounded-full"
        data-slot="skeleton-avatar"
      />
      <Skeleton
        className="h-4 w-[150px] rounded-full"
        data-slot="skeleton-username"
      />
    </div>
  );
}
