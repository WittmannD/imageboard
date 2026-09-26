import { Card, CardContent } from 'src/components/ui/card/Card.tsx';
import React from 'react';
import { cn } from 'src/lib/utils/cn.ts';
import useNumberFormatter from 'src/hooks/useNumberFormatter.ts';

function StatsRow({
  data,
  className,
  children,
  ...props
}: { data: { key: string; value: number } } & React.ComponentProps<
  typeof Card
>) {
  const formatter = useNumberFormatter({
    notation: 'compact',
    compactDisplay: 'short',
  });

  return (
    <Card
      className={cn('rounded-none border-0 py-0 shadow-none', className)}
      key={data.key}
      {...props}
    >
      <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
        <div className="font-medium text-muted-foreground text-sm">
          {data.key}
        </div>
        <div className="w-full flex-none font-medium text-3xl text-foreground tabular-nums tracking-tight">
          {formatter.format(data.value)}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatsRow };