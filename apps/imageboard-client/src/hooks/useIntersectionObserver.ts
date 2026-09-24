import { type RefObject, useEffect, useState } from 'react';

function useIntersectionObserver (
  ref: RefObject<HTMLElement | null>,
  options: IntersectionObserverInit,
): IntersectionObserverEntry | null {
  const [intersectionObserverEntry, setIntersectionObserverEntry] =
    useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    if (ref.current && typeof IntersectionObserver === 'function') {
      const handler = (entries: IntersectionObserverEntry[]) => {
        setIntersectionObserverEntry(entries[0]);
      };

      observer = new IntersectionObserver(handler, options);
      observer.observe(ref.current);
    }

    return () => {
      setIntersectionObserverEntry(null);
      observer?.disconnect();
    };
  }, [ref.current, options.threshold, options.root, options.rootMargin]);

  return intersectionObserverEntry;
};

export default useIntersectionObserver;
