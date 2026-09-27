import { Skeleton } from 'src/components/ui/skeleton/Skeleton.tsx';

function StatsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg overflow-hidden h-28 gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-full w-full max-w-sm rounded-none" />
      ))}
    </div>
  );
}

export { StatsSkeleton };
