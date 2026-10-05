import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInWeeks,
} from 'date-fns';

export function formatPostDate(date: Date | string): string {
  const now = new Date();
  const postDate = new Date(date);

  const minutes = differenceInMinutes(now, postDate);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, postDate);
  if (hours < 24) return `${hours}h`;

  const days = differenceInDays(now, postDate);
  if (days < 7) return `${days}d`;

  const weeks = differenceInWeeks(now, postDate);
  if (weeks < 4) return `${weeks}w`;

  return postDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
