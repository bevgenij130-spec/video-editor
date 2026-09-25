import { useEffect, useRef } from "react";
import { useEditorStore, editorHistory } from "../../stores/editorStore";
import type { Clip, Track } from "../../stores/types";

/** Props for the DOM clip hit-area overlay. */
export interface ClipOverlayProps {
  /** Current horizontal scroll offset (px), owned by the canvas component. */
  scrollX: number;
  /** Height of the top ruler strip (px) — must match the renderer. */
  rulerHeight: number;
  /** Height of one track lane (px) — must match the renderer. */
  trackHeight: number;
}

interface FlatClip {
  clip: Clip;
  trackIndex: number;
  locked: boolean;
}

const flattenClips = (tracks: Track[]): FlatClip[] => {
  const out: FlatClip[] = [];
  tracks.forEach((track, trackIndex) => {
    for (const clip of track.clips) {
      out.push({ clip, trackIndex, locked: track.locked });
    }
  });
  return out;
};

/**
 * Absolutely-positioned DOM layer above the Pixi canvas providing per-clip
 * hit areas (pointer-events: auto on clips only; the container is transparent
 * to pointer events so playhead scrubbing reaches the canvas).
 *
 * - Click → selectClip(id, shift/meta for multi-select).
 * - Double click → reserved for a future clip inspector (no-op for now).
 * - Horizontal drag → moveClip(id, newStart), clamped to start >= 0; zundo
 *   history is paused during the drag so the whole gesture becomes a single
 *   undo step (the final position is committed after resume).
 */
export function ClipOverlay({
  scrollX,
  rulerHeight,
  trackHeight,
}: ClipOverlayProps) {
  const tracks = useEditorStore((s) => s.tracks);
  const zoom = useEditorStore((s) => s.timelineZoom);
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Latest values for the window-level drag listeners (avoid stale closures).
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const draggingRef = useRef<{
    clipId: string;
    startX: number;
    origStart: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    // The dragged clip may shift between tracks while the pointer moves —
    // recompute the target track from the cursor Y each event.
    const trackIndexAtClientY = (clientY: number): number => {
      const container = containerRef.current;
      if (!container) return -1;
      const rect = container.getBoundingClientRect();
      const idx = Math.floor((clientY - rect.top - rulerHeight) / trackHeight);
      const tracks = useEditorStore.getState().tracks;
      return idx >= 0 && idx < tracks.length ? idx : -1;
    };

    const onMove = (e: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const dxSeconds = (e.clientX - drag.startX) / zoomRef.current;
      const newStart = Math.max(0, drag.origStart + dxSeconds);
      if (Math.abs(e.clientX - drag.startX) > 2) drag.moved = true;
      if (drag.moved) {
        const state = useEditorStore.getState();
        const target = trackIndexAtClientY(e.clientY);
        const tracks = state.tracks;
        if (target >= 0 && tracks[target] && !tracks[target].locked) {
          const currentTrackIdx = tracks.findIndex((t) =>
            t.clips.some((c) => c.id === drag.clipId),
          );
          if (currentTrackIdx !== target) {
            // moveClip only handles same-track moves; do a cross-track relayout
            const clip = tracks[currentTrackIdx]?.clips.find(
              (c) => c.id === drag.clipId,
            );
            if (clip && clip.type !== tracks[target].type) {
              // video clip can't live on an audio track and vice versa
            } else if (clip) {
              state.removeClip(clip.id);
              state.addClip(tracks[target].id, {
                ...clip,
                trackId: tracks[target].id,
                start: newStart,
              });
            }
          } else {
            state.moveClip(drag.clipId, newStart);
          }
        } else {
          state.moveClip(drag.clipId, newStart);
        }
      }
    };
    const onUp = () => {
      const drag = draggingRef.current;
      if (!drag) return;
      draggingRef.current = null;
      editorHistory.resume();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [rulerHeight, trackHeight]);

  const startDrag = (entry: FlatClip, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || entry.locked) return;
    e.stopPropagation(); // don't trigger canvas playhead scrub
    draggingRef.current = {
      clipId: entry.clip.id,
      startX: e.clientX,
      origStart: entry.clip.start,
      moved: false,
    };
    editorHistory.pause(); // collapse the whole gesture into one undo step
  };

  const gutterWidth = 120; // matches CONTENT_LEFT in pixiRenderer
  const flat = flattenClips(tracks);
  const selected = new Set(selectedClipIds);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden={false}
    >
      {flat.map(({ clip, trackIndex, locked }) => {
        const x = gutterWidth + clip.start * zoom - scrollX;
        const w = Math.max(2, clip.duration * zoom);
        const y = rulerHeight + trackIndex * trackHeight + 6;
        const h = trackHeight - 18;
        return (
          <div
            key={clip.id}
            role="button"
            tabIndex={0}
            aria-label={`Clip ${clip.name}`}
            title={`${clip.name} (${clip.duration.toFixed(2)}s)`}
            className="pointer-events-auto absolute rounded"
            style={{
              left: x,
              top: y,
              width: w,
              height: h,
              cursor: locked ? "not-allowed" : "grab",
              outline: selected.has(clip.id)
                ? "2px solid rgba(255,255,255,0.9)"
                : "none",
              outlineOffset: 0,
            }}
            onPointerDown={(e) => startDrag({ clip, trackIndex, locked }, e)}
            onClick={(e) => {
              e.stopPropagation();
              if (locked) return;
              useEditorStore
                .getState()
                .selectClip(clip.id, e.shiftKey || e.metaKey);
            }}
            onDoubleClick={(e) => {
              // Reserved for the future clip properties panel.
              e.stopPropagation();
            }}
          />
        );
      })}
    </div>
  );
}

export default ClipOverlay;
