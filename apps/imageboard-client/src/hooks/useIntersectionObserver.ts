import { type RefObject, useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  // the observer only runs while enabled; re-enabling re-observes the element,
  // which reports its current intersection state right away
  enabled?: boolean;
}

// Calls onIntersect from the observer callback itself rather than exposing the
// entry as state: a stored entry goes stale as soon as the layout changes (e.g.
// new items push the element off screen), and acting on it fires spuriously.
function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  onIntersect: (entry: IntersectionObserverEntry) => void,
  { enabled = true, root, rootMargin, threshold }: UseIntersectionObserverOptions = {},
): void {
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  });

  useEffect(() => {
    const element = ref.current;

    if (!enabled || !element || typeof IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onIntersectRef.current(entry);
        }
      },
      { root, rootMargin, threshold },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, enabled, root, rootMargin, threshold]);
}

export default useIntersectionObserver;
