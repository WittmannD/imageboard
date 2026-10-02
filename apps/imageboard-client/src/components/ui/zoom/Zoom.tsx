import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from 'src/lib/utils/cn.ts';

export interface ZoomChildrenRenderProps {
  /** The current zoom factor; 1 is the content's natural size. */
  multiplier: number;
  isZoomedIn: boolean;
  isZoomedOut: boolean;
  /**
   * True while a wheel, drag or pinch gesture is in progress. Useful to defer
   * expensive work - such as loading a larger image - until it settles.
   */
  isInteracting: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (multiplier: number) => void;
  /**
   * Zooms in to `toggleMultiplier`, or back out to 1. Pass the click event to
   * zoom in on the pointer rather than the centre.
   */
  toggle: (origin?: { clientX: number; clientY: number }) => void;
  reset: () => void;
}

export type ZoomToggleTrigger = 'click' | 'doubleClick';

export interface ZoomProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  children: (props: ZoomChildrenRenderProps) => React.ReactNode;
  /** Lowest zoom factor. Below 1 lets the content shrink. Default 1. */
  minMultiplier?: number;
  /** Highest zoom factor. Default 4. */
  maxMultiplier?: number;
  /**
   * The pointer action that toggles between 1 and `toggleMultiplier`, zooming
   * in on the pointer. `null` disables it. Default 'click'.
   */
  toggleOn?: ZoomToggleTrigger | null;
  /** The zoom factor a toggle zooms in to. Default 2. */
  toggleMultiplier?: number;
  /** Zoom with the mouse wheel and trackpad pinch. Default true. */
  wheel?: boolean;
  /**
   * Whether the wheel can zoom in from the natural size. When false, the wheel
   * only zooms content that is already zoomed in (by a toggle, pinch or
   * zoomIn), and otherwise scrolls the page; ctrl+wheel and trackpad pinch
   * still zoom. Default true.
   */
  wheelStartsZoom?: boolean;
  /** Zoom with a two-finger pinch on touch screens. Default true. */
  pinch?: boolean;
  /** Drag the content around while zoomed in. Default true. */
  pan?: boolean;
  /** The factor `zoomIn` and `zoomOut` multiply by. Default 1.5. */
  step?: number;
  /** Changing this value resets the zoom, e.g. when a carousel changes slide. */
  resetKey?: unknown;
  onZoomChange?: (multiplier: number) => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * The container's viewport and the content's box, in the container's own
 * px: free of the zoom and of any ancestor's transform.
 */
interface Measurements {
  width: number;
  height: number;
  /** The ancestors' scale: client px per container px. */
  scaleX: number;
  scaleY: number;
  /** Converts a client point (e.g. a pointer's) to container px. */
  toLocal: (point: Point) => Point;
  content: { x: number; y: number; width: number; height: number };
}

type Gesture =
  | { kind: 'pan'; start: Point; from: Transform }
  | { kind: 'pinch'; distance: number; midpoint: Point; from: Transform };

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };
/** How far a pointer may travel between down and up and still count as a click. */
const CLICK_TOLERANCE_PX = 4;
/** How long after the last wheel event a wheel gesture counts as finished. */
const WHEEL_IDLE_MS = 150;
const ANIMATION = 'transform 200ms ease-out';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Keeps the scaled content covering the viewport along one axis, or centred
 * in it when the content is smaller than the viewport.
 */
function constrainAxis(
  offset: number,
  scale: number,
  viewport: number,
  start: number,
  size: number,
) {
  const scaledStart = start * scale;
  const scaledSize = size * scale;

  if (scaledSize <= viewport) {
    return (viewport - scaledSize) / 2 - scaledStart;
  }

  return clamp(offset, viewport - scaledStart - scaledSize, -scaledStart);
}

function constrain(t: Transform, m: Measurements): Transform {
  return {
    scale: t.scale,
    x: constrainAxis(t.x, t.scale, m.width, m.content.x, m.content.width),
    y: constrainAxis(t.y, t.scale, m.height, m.content.y, m.content.height),
  };
}

/**
 * Zooms and pans whatever it renders - an image, a video, an SVG or plain
 * markup. The content is laid out centred in the container (give it
 * `max-h-full max-w-full` to fit), and its first element's box bounds the
 * panning. The zoom state is passed to `children`, so the content can react
 * to it, e.g. by loading a larger image when zoomed in.
 *
 * While panning or pinching, the component stops the pointerdown, mousedown
 * and touchstart events from propagating, so a surrounding carousel or dialog
 * does not drag as well. The click that ends a drag or a pinch is stopped too,
 * so it neither toggles the zoom nor reaches handlers such as a backdrop's.
 */
function Zoom({
  children,
  minMultiplier = 1,
  maxMultiplier = 4,
  toggleOn = 'click',
  toggleMultiplier = 2,
  wheel = true,
  wheelStartsZoom = true,
  pinch = true,
  pan = true,
  step = 1.5,
  resetKey,
  onZoomChange,
  className,
  style,
  onClick,
  onDoubleClick,
  ...props
}: ZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const [{ transform, animate }, setView] = useState({
    transform: IDENTITY,
    animate: false,
  });
  const [isGesturing, setIsGesturing] = useState(false);
  const [isWheeling, setIsWheeling] = useState(false);

  // Event handlers read the latest values from refs: pointer and wheel events
  // arrive faster than React re-renders.
  const transformRef = useRef(transform);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture | null>(null);
  const pressRef = useRef<{ start: Point; moved: boolean } | null>(null);
  const wheelTimeoutRef = useRef<number | undefined>(undefined);

  const apply = useCallback((next: Transform, shouldAnimate: boolean) => {
    transformRef.current = next;
    setView({ transform: next, animate: shouldAnimate });
  }, []);

  const measure = useCallback((): Measurements | null => {
    const container = containerRef.current;
    const layer = layerRef.current;

    if (!container || !layer) {
      return null;
    }

    const rect = container.getBoundingClientRect();

    if (!rect.width || !rect.height || !container.clientWidth) {
      return null;
    }

    // getBoundingClientRect includes ancestors' transforms - such as a
    // dialog's zoom-in animation - while the layer's translate is in the
    // container's own px. Divide them out, or the content is centred for the
    // mid-animation size and stays off-centre once it ends.
    const scaleX = rect.width / container.offsetWidth;
    const scaleY = rect.height / container.offsetHeight;

    const layerRect = layer.getBoundingClientRect();
    const contentRect = (
      layer.firstElementChild ?? layer
    ).getBoundingClientRect();
    // The layer's scale on screen: the ancestors' times the zoom actually
    // rendered, which differs from transformRef while a zoom animation runs.
    const layerScaleX = layer.offsetWidth
      ? layerRect.width / layer.offsetWidth
      : scaleX * transformRef.current.scale;
    const layerScaleY = layer.offsetHeight
      ? layerRect.height / layer.offsetHeight
      : scaleY * transformRef.current.scale;

    return {
      width: container.clientWidth,
      height: container.clientHeight,
      scaleX,
      scaleY,
      // The layer sits in the padding box, inside any border.
      toLocal: (point) => ({
        x: (point.x - rect.left) / scaleX - container.clientLeft,
        y: (point.y - rect.top) / scaleY - container.clientTop,
      }),
      content: {
        x: (contentRect.left - layerRect.left) / layerScaleX,
        y: (contentRect.top - layerRect.top) / layerScaleY,
        width: contentRect.width / layerScaleX,
        height: contentRect.height / layerScaleY,
      },
    };
  }, []);

  const clampScale = useCallback(
    (scale: number) => {
      const clamped = clamp(scale, minMultiplier, maxMultiplier);

      // Snap to the natural size so float drift does not leave the content
      // "zoomed" at 1.0000001.
      return Math.abs(clamped - 1) < 0.01 &&
        minMultiplier <= 1 &&
        maxMultiplier >= 1
        ? 1
        : clamped;
    },
    [minMultiplier, maxMultiplier],
  );

  /** Zooms to `scale`, keeping the content under `origin` (client px) in place. */
  const zoomAt = useCallback(
    (scale: number, origin: Point | null, shouldAnimate: boolean) => {
      const m = measure();

      if (!m) {
        return;
      }

      const from = transformRef.current;
      const next = clampScale(scale);
      const { x: px, y: py } = origin
        ? m.toLocal(origin)
        : { x: m.width / 2, y: m.height / 2 };
      const ratio = next / from.scale;

      apply(
        constrain(
          {
            scale: next,
            x: px - (px - from.x) * ratio,
            y: py - (py - from.y) * ratio,
          },
          m,
        ),
        shouldAnimate,
      );
    },
    [apply, clampScale, measure],
  );

  const reset = useCallback(() => apply(IDENTITY, true), [apply]);
  const zoomTo = useCallback(
    (multiplier: number) => zoomAt(multiplier, null, true),
    [zoomAt],
  );
  const zoomIn = useCallback(
    () => zoomAt(transformRef.current.scale * step, null, true),
    [step, zoomAt],
  );
  const zoomOut = useCallback(
    () => zoomAt(transformRef.current.scale / step, null, true),
    [step, zoomAt],
  );

  const toggle = useCallback(
    (origin?: { clientX: number; clientY: number }) => {
      if (transformRef.current.scale !== 1) {
        reset();
      } else {
        zoomAt(
          toggleMultiplier,
          origin ? { x: origin.clientX, y: origin.clientY } : null,
          true,
        );
      }
    },
    [reset, toggleMultiplier, zoomAt],
  );

  const startPan = useEffectEvent((start: Point) => {
    gestureRef.current = { kind: 'pan', start, from: transformRef.current };
  });

  const startPinch = useEffectEvent(() => {
    const [a, b] = [...pointersRef.current.values()];

    gestureRef.current = {
      kind: 'pinch',
      distance: distance(a, b) || 1,
      midpoint: midpoint(a, b),
      from: transformRef.current,
    };
  });

  const onPointerDown = useEffectEvent((event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const point = { x: event.clientX, y: event.clientY };
    const pointers = pointersRef.current;

    // A primary pointer starts a fresh interaction: drop any pointer whose
    // release was missed, so it cannot pose as a second finger.
    if (event.isPrimary) {
      pointers.clear();
      gestureRef.current = null;
    }

    pointers.set(event.pointerId, point);

    if (pointers.size === 1) {
      pressRef.current = { start: point, moved: false };

      if (!pan || transformRef.current.scale <= 1) {
        return;
      }

      startPan(point);
    } else if (pointers.size === 2 && pinch) {
      startPinch();
    } else {
      return;
    }

    event.stopPropagation();
    setIsGesturing(true);
  });

  const onPointerMove = useEffectEvent((event: PointerEvent) => {
    const pointers = pointersRef.current;

    if (!pointers.has(event.pointerId)) {
      return;
    }

    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);

    const press = pressRef.current;
    if (press && distance(press.start, point) > CLICK_TOLERANCE_PX) {
      press.moved = true;
    }

    const gesture = gestureRef.current;
    const m = gesture && measure();

    if (!gesture || !m) {
      return;
    }

    if (gesture.kind === 'pan') {
      apply(
        constrain(
          {
            scale: gesture.from.scale,
            x: gesture.from.x + (point.x - gesture.start.x) / m.scaleX,
            y: gesture.from.y + (point.y - gesture.start.y) / m.scaleY,
          },
          m,
        ),
        false,
      );
    } else if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const { from } = gesture;
      const scale = clampScale(
        (from.scale * distance(a, b)) / gesture.distance,
      );
      const start = m.toLocal(gesture.midpoint);
      const current = m.toLocal(midpoint(a, b));
      // The content point that was under the fingers stays under them.
      const contentX = (start.x - from.x) / from.scale;
      const contentY = (start.y - from.y) / from.scale;

      apply(
        constrain(
          {
            scale,
            x: current.x - contentX * scale,
            y: current.y - contentY * scale,
          },
          m,
        ),
        false,
      );
    }
  });

  const onPointerEnd = useEffectEvent((event: PointerEvent) => {
    const pointers = pointersRef.current;

    if (!pointers.delete(event.pointerId)) {
      return;
    }

    if (gestureRef.current?.kind === 'pinch') {
      if (pressRef.current) {
        pressRef.current.moved = true;
      }

      // Lifting one finger of a pinch carries on as a pan with the other.
      const [remaining] = [...pointers.values()];

      if (remaining && pan && transformRef.current.scale > 1) {
        startPan(remaining);
        return;
      }

      gestureRef.current = null;
    }

    if (pointers.size === 0) {
      gestureRef.current = null;
      setIsGesturing(false);
    }
  });

  const onWheel = useEffectEvent((event: WheelEvent) => {
    // Trackpad pinches arrive as ctrl+wheel; ignoring them would let the
    // browser zoom the whole page instead.
    if (
      !wheel ||
      (transformRef.current.scale === 1 && !wheelStartsZoom && !event.ctrlKey)
    ) {
      return;
    }

    const from = transformRef.current.scale;
    // Lines and pages, from mice that do not report pixels.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
    // Trackpad pinches arrive as ctrl+wheel with much smaller deltas.
    const sensitivity = event.ctrlKey ? 0.01 : 0.002;
    const scale = clampScale(
      from * Math.exp(-event.deltaY * unit * sensitivity),
    );

    // At the natural size with nowhere to go, let the page scroll.
    if (scale === from && from === 1) {
      return;
    }

    event.preventDefault();
    // A mouse notch is a big jump, smoothed by the animation; a trackpad's
    // stream of small deltas is smooth on its own.
    zoomAt(
      scale,
      { x: event.clientX, y: event.clientY },
      Math.abs(event.deltaY * unit) >= 50,
    );

    setIsWheeling(true);
    window.clearTimeout(wheelTimeoutRef.current);
    wheelTimeoutRef.current = window.setTimeout(
      () => setIsWheeling(false),
      WHEEL_IDLE_MS,
    );
  });

  // Native listeners: wheel must be non-passive to preventDefault, and the
  // press events must stop propagating before they reach ancestors' native
  // listeners (React's own stopPropagation runs too late for those).
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Moves and releases are followed on the window while pressed, so a drag
    // that leaves the container keeps working. Unlike pointer capture, this
    // leaves the click's target alone.
    const moveHandler = (event: PointerEvent) => onPointerMove(event);
    const endHandler = (event: PointerEvent) => {
      onPointerEnd(event);

      if (pointersRef.current.size === 0) {
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', endHandler);
        window.removeEventListener('pointercancel', endHandler);
      }
    };
    const downHandler = (event: PointerEvent) => {
      onPointerDown(event);

      if (pointersRef.current.size > 0) {
        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', endHandler);
        window.addEventListener('pointercancel', endHandler);
      }
    };
    // Compatibility events follow pointerdown; carousels such as Embla start
    // their drag on these rather than on pointer events.
    const pressHandler = (event: Event) => {
      if (gestureRef.current) {
        event.stopPropagation();
      }
    };
    // Capture phase: runs before the click reaches the content or bubbles up.
    const clickHandler = (event: MouseEvent) => {
      if (pressRef.current?.moved) {
        event.stopPropagation();
        event.preventDefault();
      }

      // Keyboard clicks have no press before them; don't let this one linger.
      if (event.type === 'click') {
        pressRef.current = null;
      }
    };
    const wheelHandler = (event: WheelEvent) => onWheel(event);

    container.addEventListener('pointerdown', downHandler);
    container.addEventListener('mousedown', pressHandler);
    container.addEventListener('touchstart', pressHandler);
    container.addEventListener('click', clickHandler, true);
    container.addEventListener('dblclick', clickHandler, true);
    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('pointerdown', downHandler);
      container.removeEventListener('mousedown', pressHandler);
      container.removeEventListener('touchstart', pressHandler);
      container.removeEventListener('click', clickHandler, true);
      container.removeEventListener('dblclick', clickHandler, true);
      container.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', endHandler);
      window.removeEventListener('pointercancel', endHandler);
      window.clearTimeout(wheelTimeoutRef.current);
    };
  }, []);

  // Not on mount: the initial key must not count as a change.
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current === resetKey) {
      return;
    }

    resetKeyRef.current = resetKey;
    pointersRef.current.clear();
    gestureRef.current = null;
    setIsGesturing(false);
    apply(IDENTITY, false);
  }, [resetKey, apply]);

  // Keep the content in bounds when the container resizes.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const m = measure();

      if (m) {
        apply(constrain(transformRef.current, m), false);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [apply, measure]);

  const onZoomChangeEvent = useEffectEvent((multiplier: number) =>
    onZoomChange?.(multiplier),
  );

  useEffect(() => {
    onZoomChangeEvent(transform.scale);
  }, [transform.scale]);

  const multiplier = transform.scale;
  const isZoomedIn = multiplier > 1;
  const isInteracting = isGesturing || isWheeling;

  const renderProps = useMemo<ZoomChildrenRenderProps>(
    () => ({
      multiplier,
      isZoomedIn,
      isZoomedOut: multiplier < 1,
      isInteracting,
      zoomIn,
      zoomOut,
      zoomTo,
      toggle,
      reset,
    }),
    [
      multiplier,
      isZoomedIn,
      isInteracting,
      zoomIn,
      zoomOut,
      zoomTo,
      toggle,
      reset,
    ],
  );

  const canPan = pan && isZoomedIn;

  return (
    <div
      {...props}
      ref={containerRef}
      className={cn(
        'relative overflow-hidden select-none',
        canPan
          ? isGesturing
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : toggleOn && (isZoomedIn ? 'cursor-zoom-out' : 'cursor-zoom-in'),
        className,
      )}
      style={{
        // The browser must not pan or pinch-zoom the page under our gestures.
        touchAction: pinch || canPan ? 'none' : undefined,
        ...style,
      }}
      onClick={(event) => {
        onClick?.(event);

        if (toggleOn === 'click' && !event.defaultPrevented) {
          toggle(event);
        }
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);

        if (toggleOn === 'doubleClick' && !event.defaultPrevented) {
          toggle(event);
        }
      }}
    >
      <div
        ref={layerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${multiplier})`,
          transformOrigin: '0 0',
          transition: animate ? ANIMATION : undefined,
          // Only while interacting: a permanent layer would keep the content
          // rasterized at one scale and blur it when zoomed.
          willChange: isInteracting ? 'transform' : undefined,
        }}
        // Images and links would otherwise start a native drag.
        onDragStart={(event) => event.preventDefault()}
      >
        {children(renderProps)}
      </div>
    </div>
  );
}

export default Zoom;
