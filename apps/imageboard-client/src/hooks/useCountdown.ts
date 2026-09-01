import { useEffect, useState } from 'react';

function getRemainingMs(targetTimestamp: number) {
  return Math.max(0, targetTimestamp - Date.now());
}

/** Ticks down to zero once per second until `targetTimestamp` (epoch ms) is reached. */
function useCountdown(targetTimestamp: number) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemainingMs(targetTimestamp),
  );

  useEffect(() => {
    setRemainingMs(getRemainingMs(targetTimestamp));

    const interval = setInterval(() => {
      const next = getRemainingMs(targetTimestamp);
      setRemainingMs(next);

      if (next <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetTimestamp]);

  return remainingMs;
}

export default useCountdown;
