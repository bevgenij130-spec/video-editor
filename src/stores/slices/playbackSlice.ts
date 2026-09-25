import type { StateCreator } from "zustand";

/** Transport / playback state. */
export interface PlaybackState {
  isPlaying: boolean;
  /** Current playhead position in seconds (transport view of the timeline). */
  currentTime: number;
  /** Total program duration in seconds. */
  duration: number;
  /** Master volume, 0..1. */
  volume: number;
  loop: boolean;
}

/** Transport actions. */
export interface PlaybackActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setLoop: (loop: boolean) => void;
}

export type PlaybackSlice = PlaybackState & PlaybackActions;

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  loop: false,
};

export const createPlaybackSlice: StateCreator<
  PlaybackSlice,
  [],
  [],
  PlaybackSlice
> = (set) => ({
  ...initialPlaybackState,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seek: (time) =>
    set((state) => {
      const clamped = Math.min(Math.max(0, time), state.duration || time);
      return { currentTime: clamped };
    }),

  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),

  setLoop: (loop) => set({ loop }),
});
