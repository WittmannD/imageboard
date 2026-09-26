import { useGetUserStatsQuery } from 'src/services/api/user/api.ts';
import { StatsRow } from 'src/components/features/stats/StatsRow.tsx';

function Stats({ userId }: { userId: number }) {
  const { data: stats } = useGetUserStatsQuery(userId);

  if (!stats) return null;

  return (
    <div className="flex items-center justify-center">
      <div className="w-full grid grid-cols-1 gap-1 rounded-xl sm:grid-cols-2">
        <StatsRow
          data={{ key: 'Posts', value: stats.postsCount }}
          className="rounded-l-xl"
        />
        <StatsRow
          data={{ key: 'Likes', value: stats.likesReceived }}
          className="rounded-r-xl"
        />
      </div>
    </div>
  );
}

export { Stats };