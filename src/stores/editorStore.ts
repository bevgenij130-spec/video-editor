import { create } from "zustand";
import { combine } from "zustand/middleware";
import {
  createProjectSlice,
  type ProjectSlice,
} from "./slices/projectSlice";
import {
  createPlaybackSlice,
  type PlaybackSlice,
} from "./slices/playbackSlice";
import {
  createTimelineSlice,
  type TimelineSlice,
} from "./slices/timelineSlice";
import { createMediaSlice, type MediaSlice } from "./slices/mediaSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";

/** Combined editor store state (skeleton — no logic yet). */
export type EditorState = ProjectSlice &
  PlaybackSlice &
  TimelineSlice &
  MediaSlice &
  UiSlice;

export const useEditorStore = create<EditorState>()(
  combine(
    {} as EditorState,
    (set, get, api) => ({
      ...createProjectSlice(set, get, api),
      ...createPlaybackSlice(set, get, api),
      ...createTimelineSlice(set, get, api),
      ...createMediaSlice(set, get, api),
      ...createUiSlice(set, get, api),
    }),
  ),
);
