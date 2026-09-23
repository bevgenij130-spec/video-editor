import { useRef } from "react";
import { useVideoFrame } from "../../hooks/useVideoFrame";

/**
 * Preview surface. Frames will be delivered from the Rust decoder
 * (GPU texture / shared memory). Skeleton only.
 */
export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useVideoFrame(canvasRef, null);

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default PreviewCanvas;
