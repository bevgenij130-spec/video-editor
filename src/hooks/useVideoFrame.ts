import { useEffect } from "react";

/**
 * Subscribes to decoded video frames pushed from the Rust backend
 * (zero-copy GPU textures with shared-memory fallback). Skeleton only:
 * decoding lives entirely in Rust — no WebCodecs here.
 */
export function useVideoFrame(
  _canvasRef: React.RefObject<HTMLCanvasElement | null>,
  _clipId: string | null,
): void {
  useEffect(() => {
    // Placeholder: listen for Tauri frame events and blit them via pixiRenderer.
  }, [_canvasRef, _clipId]);
}
