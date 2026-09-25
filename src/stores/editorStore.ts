import { create } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import type { StoreApi } from "zustand";
import type { TemporalState } from "zundo";
import type {
  Clip,
  MediaItem,
  Notification,
  Project,
  Track,
  TrackType,
} from "./types";
import { createProjectSlice, type ProjectSlice } from "./slices/projectSlice";
import {
  createTimelineSlice,
  type TimelineActions,
  type TimelineState,
} from "./slices/timelineSlice";
import {
  createPlaybackSlice,
  type PlaybackSlice,
} from "./slices/playbackSlice";
import {
  createMediaSlice,
  type MediaImportFile,
  type MediaSlice,
} from "./slices/mediaSlice";
import { createUiSlice, type UiActions, type UiSlice } from "./slices/uiSlice";
import {
  withHistory,
  type HistoryTrackedState,
} from "./historyMiddleware";

/** Full editor store state = all slices combined. */
export type EditorState = ProjectSlice &
  TimelineState &
  TimelineActions &
  PlaybackSlice &
  MediaSlice &
  UiSlice;

/** Zustand store shape of the zundo temporal slice. */
type EditorTemporalState = TemporalState<HistoryTrackedState>;

/**
 * Main editor store: zustand + zundo `temporal` history restricted via
 * `partialize` to project + tracks (see historyMiddleware.withHistory).
 * UI / playback / media state never enters the undo stack. Limit: 100 steps.
 */
export const useEditorStore = create<EditorState>()(
  withHistory<EditorState>((set, get, api) => ({
    ...createProjectSlice(set, get, api),
    ...createTimelineSlice(set, get, api),
    ...createPlaybackSlice(set, get, api),
    ...createMediaSlice(set, get, api),
    ...createUiSlice(set, get, api),
  })),
);

/** Access the underlying zundo temporal store (typed). */
const getTemporalStore = (): StoreApi<EditorTemporalState> =>
  (
    useEditorStore as unknown as {
      temporal: StoreApi<EditorTemporalState>;
    }
  ).temporal;

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

/** Shallow object/array equality for selector results. */
const shallow = <T,>(a: T, b: T): boolean => {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) =>
    Object.is(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    ),
  );
};

/** Project document state (`project`, `projectPath`). */
export const useProject = (): {
  project: Project | null;
  projectPath: string | null;
} =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({ project: s.project, projectPath: s.projectPath }),
    shallow,
  );

/** Timeline document state (`tracks`, selection, playhead). */
export const useTimeline = (): {
  tracks: Track[];
  selectedClipIds: string[];
  playheadPosition: number;
} =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({
      tracks: s.tracks,
      selectedClipIds: s.selectedClipIds,
      playheadPosition: s.playheadPosition,
    }),
    shallow,
  );

/** Playback / transport state. */
export const usePlayback = (): {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
} =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({
      isPlaying: s.isPlaying,
      currentTime: s.currentTime,
      duration: s.duration,
      volume: s.volume,
      loop: s.loop,
    }),
    shallow,
  );

/** Media library state. */
export const useMedia = (): {
  mediaItems: MediaItem[];
  selectedMediaId: string | null;
} =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({ mediaItems: s.mediaItems, selectedMediaId: s.selectedMediaId }),
    shallow,
  );

/** UI chrome state. */
export const useUI = (): {
  activeTool: UiSlice["activeTool"];
  timelineZoom: number;
  sidebarWidth: number;
  timelineHeight: number;
  notifications: Notification[];
} =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({
      activeTool: s.activeTool,
      timelineZoom: s.timelineZoom,
      sidebarWidth: s.sidebarWidth,
      timelineHeight: s.timelineHeight,
      notifications: s.notifications,
    }),
    shallow,
  );

/** Stable bag of every action (references never change identity). */
export interface EditorActions {
  newProject: (
    name: string,
    fps: number,
    width: number,
    height: number,
  ) => void;
  loadProject: (path: string, project?: Project) => void;
  saveProject: () => void;
  closeProject: () => void;
  addTrack: (type: TrackType) => void;
  removeTrack: (id: string) => void;
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStart: number) => void;
  trimClip: (clipId: string, newStart: number, newEnd: number) => void;
  splitClip: (clipId: string, atTime: number) => void;
  selectClip: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setPlayhead: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setLoop: (loop: boolean) => void;
  importMedia: (files: MediaImportFile[]) => void;
  removeMedia: (id: string) => void;
  selectMedia: (id: string | null) => void;
  setActiveTool: UiActions["setActiveTool"];
  setTimelineZoom: (zoom: number) => void;
  notify: (type: Notification["type"], message: string) => void;
  dismissNotification: (id: string) => void;
}

/**
 * All store actions in one object. Zustand actions live directly on state and
 * keep stable identities, so a shallow-compared pick never re-renders.
 */
export const useEditorActions = (): EditorActions =>
  useStoreWithEqualityFn(
    useEditorStore,
    (s) => ({
      newProject: s.newProject,
      loadProject: s.loadProject,
      saveProject: s.saveProject,
      closeProject: s.closeProject,
      addTrack: s.addTrack,
      removeTrack: s.removeTrack,
      addClip: s.addClip,
      removeClip: s.removeClip,
      moveClip: s.moveClip,
      trimClip: s.trimClip,
      splitClip: s.splitClip,
      selectClip: s.selectClip,
      clearSelection: s.clearSelection,
      setPlayhead: s.setPlayhead,
      play: s.play,
      pause: s.pause,
      togglePlay: s.togglePlay,
      seek: s.seek,
      setVolume: s.setVolume,
      setLoop: s.setLoop,
      importMedia: s.importMedia,
      removeMedia: s.removeMedia,
      selectMedia: s.selectMedia,
      setActiveTool: s.setActiveTool,
      setTimelineZoom: s.setTimelineZoom,
      notify: s.notify,
      dismissNotification: s.dismissNotification,
    }),
    shallow,
  );

/** Undo/redo controls backed by zundo temporal state. */
export const useUndoRedo = (): {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
} => {
  const canUndo = useStoreWithEqualityFn(
    getTemporalStore(),
    (s) => s.pastStates.length > 0,
    Object.is,
  );
  const canRedo = useStoreWithEqualityFn(
    getTemporalStore(),
    (s) => s.futureStates.length > 0,
    Object.is,
  );
  return {
    undo: () => getTemporalStore().getState().undo(),
    redo: () => getTemporalStore().getState().redo(),
    canUndo,
    canRedo,
  };
};

/** Non-hook escape hatch for imperative history access. */
export const editorHistory = {
  undo: () => getTemporalStore().getState().undo(),
  redo: () => getTemporalStore().getState().redo(),
  clear: () => getTemporalStore().getState().clear(),
  canUndo: () => getTemporalStore().getState().pastStates.length > 0,
  canRedo: () => getTemporalStore().getState().futureStates.length > 0,
};

// Re-export for convenience so consumers don't need deep imports.
export type {
  Clip,
  MediaItem,
  Notification,
  Project,
  Track,
  TrackType,
} from "./types";
