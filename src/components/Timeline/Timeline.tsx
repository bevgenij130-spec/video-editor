import { TimelinePixi } from "./TimelinePixi";

/**
 * Timeline container: dark backdrop hosting the Pixi canvas layer plus the
 * DOM clip-overlay layer (both rendered inside {@link TimelinePixi}).
 */
export function Timeline() {
  return (
    <div className="relative h-full w-full bg-[#0d0d10]">
      <TimelinePixi />
    </div>
  );
}

export default Timeline;
