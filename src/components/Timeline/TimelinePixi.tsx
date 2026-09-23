import { useEffect, useRef } from "react";
import { initPixiRenderer, type PixiRendererHandle } from "../../lib/pixiRenderer";
import { ClipOverlay } from "./ClipOverlay";

/**
 * Timeline area rendered with Pixi.js (skeleton — no clips drawn yet).
 */
export function TimelinePixi() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let renderer: PixiRendererHandle | null = null;
    let cancelled = false;

    if (hostRef.current) {
      initPixiRenderer(hostRef.current).then((h) => {
        if (cancelled) h.destroy();
        else renderer = h;
      });
    }

    return () => {
      cancelled = true;
      renderer?.destroy();
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0d0d10]">
      <div ref={hostRef} className="absolute inset-0" />
      <ClipOverlay />
    </div>
  );
}

export default TimelinePixi;
