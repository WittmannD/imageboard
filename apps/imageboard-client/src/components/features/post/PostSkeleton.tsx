import { UserBadgeSkeleton } from 'src/components/features/user/UserBadgeSkeleton.tsx';
import { Skeleton } from 'src/components/ui/skeleton/Skeleton.tsx';

export function PostSkeleton() {
  return (
    <div className="bg-muted/50 rounded-lg overflow-hidden">
      <div className="h-64 w-full flex gap-1.5">
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <UserBadgeSkeleton size="sm" />
        <Skeleton className="h-4 w-full max-w-62" />
      </div>
    </div>
  );
}
