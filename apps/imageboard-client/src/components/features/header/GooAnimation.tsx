import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from 'src/lib/utils/cn.ts';

type Point = {
  x: number;
  y: number;
};

type FloatingElementsProps = {
  count: number;

  /**
   * Size of each floating element in pixels.
   */
  itemSize?: number;

  /**
   * Minimum distance between elements, in pixels.
   *
   * This is measured between their bounding boxes.
   */
  spacing?: number;

  /**
   * Movement speed in pixels per second.
   */
  speed?: number;

  /**
   * Number of random destinations in each path.
   */
  directionChanges?: number;

  /**
   * Function used to render each element.
   */
  renderItem?: (index: number) => ReactNode;
};

type FloatingItem = {
  id: number;
  path: Point[];
};

const DEFAULT_SPACING = 20;
const DEFAULT_SPEED = 60;
const DEFAULT_DIRECTION_CHANGES = 6;

const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

const distance = (a: Point, b: Point): number => {
  return Math.hypot(b.x - a.x, b.y - a.y);
};

/**
 * Coordinates represent the TOP-LEFT corner of an element.
 */
const generateInitialPositions = (
  count: number,
  containerWidth: number,
  containerHeight: number,
): Point[] => {
  const positions: Point[] = [];

  const maxX = containerWidth;
  const maxY = containerHeight;

  if (maxX < 0 || maxY < 0) {
    return [];
  }

  for (let index = 0; index < count; index++) {
    positions.push({
      x: randomBetween(0, maxX),
      y: randomBetween(0, maxY),
    });
  }

  return positions;
};

/**
 * Generates random waypoints that stay inside the container.
 */
const generatePath = (
  start: Point,
  elementSize: number,
  containerWidth: number,
  containerHeight: number,
  directionChanges: number,
): Point[] => {
  const maxX = containerWidth - elementSize;
  const maxY = containerHeight - elementSize;

  const path: Point[] = [start];

  for (let index = 0; index < directionChanges; index++) {
    path.push({
      x: randomBetween(0, maxX),
      y: randomBetween(0, maxY),
    });
  }

  return path;
};

/**
 * Creates CSS keyframes.
 *
 * The important part is that keyframe percentages are calculated
 * from DISTANCE, not simply distributed evenly.
 *
 * Therefore:
 *
 *   longer segment -> more animation time
 *   shorter segment -> less animation time
 *
 * resulting in constant velocity.
 */
const createKeyframes = (name: string, path: Point[]): string => {
  if (path.length < 2) {
    return '';
  }

  const segmentDistances = path
    .slice(0, -1)
    .map((point, index) => distance(point, path[index + 1]));

  const totalDistance = segmentDistances.reduce((sum, value) => sum + value, 0);

  if (totalDistance === 0) {
    return `
      @keyframes ${name} {
        from {
          transform: translate(0, 0);
        }

        to {
          transform: translate(0, 0);
        }
      }
    `;
  }

  let accumulatedDistance = 0;

  const keyframes = path
    .map((point, index) => {
      if (index > 0) {
        accumulatedDistance += segmentDistances[index - 1];
      }

      const percentage = (accumulatedDistance / totalDistance) * 100;

      return `
        ${percentage}% {
          transform: translate(
            ${point.x}px,
            ${point.y}px
          );
        }
      `;
    })
    .join('\n');

  return `
    @keyframes ${name} {
      ${keyframes}
    }
  `;
};

export function Blobs({
  className,
  count,
  spacing = DEFAULT_SPACING,
  speed = DEFAULT_SPEED,
  directionChanges = DEFAULT_DIRECTION_CHANGES,
  renderItem = (index) => <div>{index}</div>,
  ...props
}: ComponentProps<'div'> & FloatingElementsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [sizes, setSizes] = useState<Record<number, number>>({});

  const [items, setItems] = useState<FloatingItem[]>([]);

  /** * Measure an individual element. */
  const measureItem = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      itemRefs.current[index] = element;
      if (!element) {
        return;
      }
      const { width } = element.getBoundingClientRect();
      setSizes((current) => {
        const previous = current[index];
        if (Math.round(previous) === Math.round(width)) {
          return current;
        }
        return { ...current, [index]: width };
      });
    },
    [],
  );

  /** * Re-measure elements when their dimensions change. */
  useLayoutEffect(() => {
    const observers: ResizeObserver[] = [];
    itemRefs.current.forEach((element, index) => {
      if (!element) {
        return;
      }
      const observer = new ResizeObserver(([entry]) => {
        const { width } = entry.contentRect;
        setSizes((current) => {
          if (current[index] === width) {
            return current;
          }
          return { ...current, [index]: width };
        });
      });
      observer.observe(element);
      observers.push(observer);
    });
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [count]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const allElementsMeasured = Array.from({ length: count }).every(
      (_, index) => sizes[index],
    );
    if (!allElementsMeasured) {
      return;
    }

    const update = () => {
      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();

      const elementSizes = Array.from(
        { length: count },
        (_, index) => sizes[index],
      );

      const initialPositions = generateInitialPositions(
        count,
        containerWidth,
        containerHeight,
      );

      const nextItems: FloatingItem[] = initialPositions.map(
        (start, index) => ({
          id: index,

          path: generatePath(
            start,
            elementSizes[index],
            containerWidth,
            containerHeight,
            directionChanges,
          ),
        }),
      );

      setItems(nextItems);
    };

    update();

    const observer = new ResizeObserver(update);

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [count, sizes, speed, directionChanges]);

  /*
   * One <style> element contains all generated keyframes.
   */
  const keyframes = items
    .map((item) => createKeyframes(`floating-element-${item.id}`, item.path))
    .join('\n');

  return (
    <div {...props} ref={containerRef} className={cn('relative', className)}>
      <style>{keyframes}</style>

      {Array.from({ length: count }, (_, index) => {
        const item = items[index];

        /*
         * The element must exist before we can measure it.
         */
        if (!item) {
          return (
            <div
              key={index}
              ref={(element) => measureItem(index, element)}
              className="inline-block absolute top-0 left-0 ease-linear will-change-transform [animation-iteration-count:infinite]"
            >
              {renderItem(index)}
            </div>
          );
        }

        const totalDistance = item.path
          .slice(0, -1)
          .reduce(
            (total, point, index) =>
              total + distance(point, item.path[index + 1]),
            0,
          );

        const duration = totalDistance / speed;

        const style = {
          animationName: `floating-element-${item.id}`,
          animationDuration: `${duration}s`,
        } as CSSProperties;

        return (
          <div
            key={item.id}
            ref={(element) => measureItem(index, element)}
            className="inline-block absolute top-0 left-0 ease-linear will-change-transform [animation-iteration-count:infinite]"
            style={style}
          >
            {renderItem(item.id)}
          </div>
        );
      })}
    </div>
  );
}

export function GooAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('spottish', className)}>
      <div className="spottish__halftone">
        <Blobs
          className="spottish__goo absolute"
          count={10}
          spacing={30}
          speed={20}
          directionChanges={8}
          renderItem={() => <span className="spottish__blob"></span>}
        />
        <div className="spottish__screen"></div>
      </div>
    </div>
  );
}
