import { useCallback, useEffect, useRef, useState } from "react";
import {
  TimelineRenderer,
  RULER_HEIGHT,
  TRACK_HEIGHT,
  type TimelineRenderState,
} from "../../lib/pixiRenderer";
import {
  useEditorStore,
} from "../../stores/editorStore";
import { ClipOverlay } from "./ClipOverlay";

/** Props for the Pixi timeline canvas component. */
export interface TimelinePixiProps {
  /** Called whenever the horizontal scroll offset changes so sibling DOM
   *  layers (clip overlay) can stay aligned with the canvas content. */
  onScrollChange?: (scrollX: number) => void;
}

/** Convert current store state into a pure render snapshot. */
const toRenderState = (
  el: HTMLDivElement,
  scrollX: number,
): TimelineRenderState => {
  const s = useEditorStore.getState();
  return {
    tracks: s.tracks,
    playheadPosition: s.playheadPosition,
    zoom: s.timelineZoom,
    scrollX,
    selectedClipIds: s.selectedClipIds,
    width: el.clientWidth,
    height: el.clientHeight,
  };
};

/**
 * Pixi-rendered timeline canvas + interaction surface.
 *
 * - Creates a {@link TimelineRenderer} bound to the canvas on mount and
 *   destroys it on unmount.
 * - Re-renders on any store change affecting the timeline (tracks, playhead,
 *   selection, zoom) via `useEditorStore.subscribe`, plus on container resize.
 * - Canvas-level pointer events drive scrubbing: click/drag in the ruler or
 *   empty lane area moves the playhead (`seek`); Ctrl+wheel zooms.
 * - Clip hit-testing is delegated to the DOM {@link ClipOverlay}.
 */
export function TimelinePixi({ onScrollChange }: TimelinePixiProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollXRef = useRef(0);
  const [scrollX, setScrollXState] = useState(0);
  const onScrollChangeRef = useRef(onScrollChange);
  onScrollChangeRef.current = onScrollChange;

  /** Update the shared scroll offset (ref for canvas math + state for overlay). */
  const setScrollX = useCallback((next: number) => {
    const clamped = Math.max(0, next);
    if (clamped === scrollXRef.current) return;
    scrollXRef.current = clamped;
    setScrollXState(clamped);
    onScrollChangeRef.current?.(clamped);
  }, []);
  const setScrollXRef = useRef(setScrollX);
  setScrollXRef.current = setScrollX;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const renderer = new TimelineRenderer(canvas);
    let raf = 0;
    const scheduleRender = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        renderer.render(toRenderState(host, scrollXRef.current));
      });
    };
    scheduleRender();

    // Re-render whenever timeline-relevant state changes.
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (
        state.tracks !== prev.tracks ||
        state.playheadPosition !== prev.playheadPosition ||
        state.selectedClipIds !== prev.selectedClipIds ||
        state.timelineZoom !== prev.timelineZoom
      ) {
        scheduleRender();
      }
    });

    const resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(host);

    // ----- pointer interactions on the canvas ------------------------------
    const timeAtX = (clientX: number): number => {
      const rect = canvas.getBoundingClientRect();
      const zoom = useEditorStore.getState().timelineZoom;
      return Math.max(0, (clientX - rect.left + scrollXRef.current) / zoom);
    };

    let draggingPlayhead = false;
    const onPointerDown = (e: PointerEvent) => {
      // Only left button; clip drags are handled by the DOM overlay which
      // stops propagation before reaching the canvas.
      if (e.button !== 0) return;
      draggingPlayhead = true;
      canvas.setPointerCapture(e.pointerId);
      useEditorStore.getState().seek(timeAtX(e.clientX));
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingPlayhead) return;
      useEditorStore.getState().seek(timeAtX(e.clientX));
    };
    const onPointerUp = (e: PointerEvent) => {
      draggingPlayhead = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    // Ctrl+wheel → zoom around cursor; plain wheel → horizontal scroll.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const store = useEditorStore.getState();
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const anchorSec =
          (e.clientX - rect.left + scrollXRef.current) / store.timelineZoom;
        const factor = Math.exp(-e.deltaY * 0.0015);
        const nextZoom = Math.min(500, Math.max(1, store.timelineZoom * factor));
        store.setTimelineZoom(nextZoom);
        setScrollXRef.current(anchorSec * nextZoom - (e.clientX - rect.left));
      } else {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        setScrollXRef.current(scrollXRef.current + delta);
      }
      scheduleRender();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      renderer.destroy();
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: "none" }}
      />
      <ClipOverlay
        scrollX={scrollX}
        rulerHeight={RULER_HEIGHT}
        trackHeight={TRACK_HEIGHT}
      />
    </div>
  );
}

export default TimelinePixi;
