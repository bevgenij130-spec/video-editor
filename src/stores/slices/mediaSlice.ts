import type { StateCreator } from "zustand";

/** Media pool slice — skeleton only (import / proxy generation come later). */
export interface MediaItem {
  id: string;
  name: string;
  path: string;
  durationSec: number;
}

export interface MediaState {
  items: MediaItem[];
}

export interface MediaActions {
  // Placeholder: importMedia / generateProxies will come later.
  noopMedia: () => void;
}

export type MediaSlice = MediaState & MediaActions;

const initialMediaState: MediaState = {
  items: [],
};

export const createMediaSlice: StateCreator<
  MediaSlice,
  [],
  [],
  MediaSlice
> = (set) => ({
  ...initialMediaState,
  noopMedia: () => set(() => ({})),
});
