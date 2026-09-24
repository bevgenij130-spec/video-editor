import type { StateCreator } from "zustand";
import type { Clip, Track, TrackType } from "../types";
import { genId } from "../types";

/** Timeline document state. */
export interface TimelineState {
  tracks: Track[];
  selectedClipIds: string[];
  /** Playhead position in seconds. */
  playheadPosition: number;
}

/** Timeline editing actions. */
export interface TimelineActions {
  addTrack: (type: TrackType) => void;
  removeTrack: (id: string) => void;
  /** Add a clip to a track; `trackId` on the clip is synced automatically. */
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStart: number) => void;
  /** Trim by absolute timeline start/end (seconds). */
  trimClip: (clipId: string, newStart: number, newEnd: number) => void;
  /** Split a clip at an absolute timeline time. No-op if outside the clip. */
  splitClip: (clipId: string, atTime: number) => void;
  selectClip: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setPlayhead: (time: number) => void;
}

export type TimelineSlice = TimelineState & TimelineActions;

const initialTimelineState: TimelineState = {
  tracks: [],
  selectedClipIds: [],
  playheadPosition: 0,
};

/** Find [trackIndex, clipIndex] for a clip id, or [-1, -1]. */
const findClip = (tracks: Track[], clipId: string): [number, number] => {
  for (let t = 0; t < tracks.length; t++) {
    const clips = tracks[t].clips;
    for (let c = 0; c < clips.length; c++) {
      if (clips[c].id === clipId) return [t, c];
    }
  }
  return [-1, -1];
};

export const createTimelineSlice: StateCreator<
  TimelineSlice,
  [],
  [],
  TimelineSlice
> = (set) => ({
  ...initialTimelineState,

  addTrack: (type) =>
    set((state) => {
      const count = state.tracks.filter((t) => t.type === type).length + 1;
      const track: Track = {
        id: genId(),
        type,
        name: `${type === "video" ? "Video" : "Audio"} ${count}`,
        clips: [],
        muted: false,
        locked: false,
      };
      return { tracks: [...state.tracks, track] };
    }),

  removeTrack: (id) =>
    set((state) => {
      const removed = state.tracks.find((t) => t.id === id);
      const removedClipIds = new Set(
        (removed?.clips ?? []).map((c) => c.id),
      );
      return {
        tracks: state.tracks.filter((t) => t.id !== id),
        selectedClipIds: state.selectedClipIds.filter(
          (cid) => !removedClipIds.has(cid),
        ),
      };
    }),

  addClip: (trackId, clip) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: [...t.clips, { ...clip, trackId }] }
          : t,
      ),
    })),

  removeClip: (clipId) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.clips.some((c) => c.id === clipId)
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t,
      ),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    })),

  moveClip: (clipId, newStart) =>
    set((state) => {
      const [ti, ci] = findClip(state.tracks, clipId);
      if (ti === -1 || newStart < 0) return state;
      const tracks = state.tracks.map((t, i) =>
        i !== ti
          ? t
          : {
              ...t,
              clips: t.clips.map((c, j) =>
                j !== ci ? c : { ...c, start: newStart },
              ),
            },
      );
      return { tracks };
    }),

  trimClip: (clipId, newStart, newEnd) =>
    set((state) => {
      const [ti, ci] = findClip(state.tracks, clipId);
      if (ti === -1) return state;
      const clip = state.tracks[ti].clips[ci];
      const clampedStart = Math.max(0, Math.min(newStart, newEnd));
      const clampedEnd = Math.max(clampedStart, newEnd);
      // Keep source in-point consistent with how much was trimmed off the head.
      const headTrim = clampedStart - clip.start;
      const newSourceStart = Math.min(
        clip.sourceDuration,
        Math.max(0, clip.sourceStart + headTrim),
      );
      const tracks = state.tracks.map((t, i) =>
        i !== ti
          ? t
          : {
              ...t,
              clips: t.clips.map((c, j) =>
                j !== ci
                  ? c
                  : {
                      ...c,
                      start: clampedStart,
                      duration: clampedEnd - clampedStart,
                      sourceStart: newSourceStart,
                    },
              ),
            },
      );
      return { tracks };
    }),

  splitClip: (clipId, atTime) =>
    set((state) => {
      const [ti, ci] = findClip(state.tracks, clipId);
      if (ti === -1) return state;
      const track = state.tracks[ti];
      const clip = track.clips[ci];
      const offset = atTime - clip.start;
      // Only split strictly inside the clip body.
      if (offset <= 0 || offset >= clip.duration) return state;
      const left: Clip = { ...clip, duration: offset };
      const right: Clip = {
        ...clip,
        id: genId(),
        start: atTime,
        duration: clip.duration - offset,
        sourceStart: clip.sourceStart + offset,
      };
      const tracks = state.tracks.map((t, i) =>
        i !== ti
          ? t
          : {
              ...t,
              clips: t.clips.flatMap((c, j) =>
                j !== ci ? [c] : [left, right],
              ),
            },
      );
      return { tracks };
    }),

  selectClip: (id, multi = false) =>
    set((state) => {
      if (!multi) return { selectedClipIds: [id] };
      return {
        selectedClipIds: state.selectedClipIds.includes(id)
          ? state.selectedClipIds.filter((x) => x !== id)
          : [...state.selectedClipIds, id],
      };
    }),

  clearSelection: () => set({ selectedClipIds: [] }),

  setPlayhead: (time) => set({ playheadPosition: Math.max(0, time) }),
});
