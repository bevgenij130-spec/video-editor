import type { StateCreator } from "zustand";
import type { ClipType, MediaItem } from "../types";
import { genId } from "../types";

/** Minimal shape accepted by importMedia — a File-like descriptor.
 *  Real metadata (duration/size/fps) is probed later by the Rust backend;
 *  until then sensible defaults are stored. */
export interface MediaImportFile {
  name: string;
  path?: string;
  type?: ClipType;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  thumbnail?: string;
}

/** Media library state. */
export interface MediaState {
  mediaItems: MediaItem[];
  selectedMediaId: string | null;
}

/** Media library actions. */
export interface MediaActions {
  importMedia: (files: MediaImportFile[]) => void;
  removeMedia: (id: string) => void;
  selectMedia: (id: string | null) => void;
}

export type MediaSlice = MediaState & MediaActions;

const initialMediaState: MediaState = {
  mediaItems: [],
  selectedMediaId: null,
};

/** Guess clip type from a file name extension. */
const guessType = (name: string): ClipType => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext))
    return "image";
  return "video";
};

export const createMediaSlice: StateCreator<
  MediaSlice,
  [],
  [],
  MediaSlice
> = (set) => ({
  ...initialMediaState,

  importMedia: (files) =>
    set((state) => {
      const items: MediaItem[] = files.map((f) => ({
        id: genId(),
        name: f.name,
        path: f.path ?? f.name,
        duration: f.duration ?? 0,
        width: f.width ?? 0,
        height: f.height ?? 0,
        fps: f.fps ?? 0,
        type: f.type ?? guessType(f.name),
        thumbnail: f.thumbnail,
      }));
      return { mediaItems: [...state.mediaItems, ...items] };
    }),

  removeMedia: (id) =>
    set((state) => ({
      mediaItems: state.mediaItems.filter((m) => m.id !== id),
      selectedMediaId:
        state.selectedMediaId === id ? null : state.selectedMediaId,
    })),

  selectMedia: (id) => set({ selectedMediaId: id }),
});
