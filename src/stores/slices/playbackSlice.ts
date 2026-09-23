import type { StateCreator } from "zustand";

/** Playback slice — skeleton only (audio clock @48kHz integration comes later). */
export interface PlaybackState {
  isPlaying: boolean;
  /** Current playhead position in seconds. */
  currentTime: number;
  playbackRate: number;
}

export interface PlaybackActions {
  // Placeholder: play / pause / seek will come later.
  noopPlayback: () => void;
}

export type PlaybackSlice = PlaybackState & PlaybackActions;

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
};

export const createPlaybackSlice: StateCreator<
  PlaybackSlice,
  [],
  [],
  PlaybackSlice
> = (set) => ({
  ...initialPlaybackState,
  noopPlayback: () => set(() => ({})),
});
