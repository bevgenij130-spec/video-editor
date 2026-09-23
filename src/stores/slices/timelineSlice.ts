import type { StateCreator } from "zustand";

/** Timeline slice — skeleton only (Pixi rendering + clip ops come later). */
export interface TimelineState {
  /** Pixels per second at current zoom. */
  pixelsPerSecond: number;
  /** Vertical scroll offset in pixels. */
  scrollY: number;
  selectedClipId: string | null;
}

export interface TimelineActions {
  // Placeholder: addTrack / addClip / moveClip / trimClip will come later.
  noopTimeline: () => void;
}

export type TimelineSlice = TimelineState & TimelineActions;

const initialTimelineState: TimelineState = {
  pixelsPerSecond: 50,
  scrollY: 0,
  selectedClipId: null,
};

export const createTimelineSlice: StateCreator<
  TimelineSlice,
  [],
  [],
  TimelineSlice
> = (set) => ({
  ...initialTimelineState,
  noopTimeline: () => set(() => ({})),
});
