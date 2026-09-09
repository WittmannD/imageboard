import { useEffect, useEffectEvent } from 'react';
import { isClient } from 'src/lib/utils/is-client.ts';

export function useKeyPress(
  key: string,
  cb: (e: Event) => void,
  options?: {
    event?: string;
    target?: Element | Window;
    eventOptions?: object;
  },
) {
  const {
    event = 'keydown',
    target = isClient() ? window : null,
    eventOptions,
  } = options ?? {};
  const onListen = useEffectEvent(cb);

  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === key) {
        onListen(event);
      }
    };

    target?.addEventListener(event, handler, eventOptions);

    return () => {
      target?.removeEventListener(event, handler, eventOptions);
    };
  }, [key, target, event, eventOptions]);
}
