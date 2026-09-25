import type { StateCreator } from "zustand";
import type { Notification } from "../types";
import { genId } from "../types";

export type ActiveTool = "select" | "razor" | "hand";

/** UI chrome state. */
export interface UiState {
  activeTool: ActiveTool;
  /** Timeline horizontal zoom — pixels per second. */
  timelineZoom: number;
  sidebarWidth: number;
  timelineHeight: number;
  notifications: Notification[];
}

/** UI actions. */
export interface UiActions {
  setActiveTool: (tool: ActiveTool) => void;
  setTimelineZoom: (zoom: number) => void;
  setSidebarWidth: (width: number) => void;
  setTimelineHeight: (height: number) => void;
  notify: (type: Notification["type"], message: string) => void;
  dismissNotification: (id: string) => void;
}

export type UiSlice = UiState & UiActions;

const initialUiState: UiState = {
  activeTool: "select",
  timelineZoom: 50,
  sidebarWidth: 280,
  timelineHeight: 260,
  notifications: [],
};

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  ...initialUiState,

  setActiveTool: (tool) => set({ activeTool: tool }),

  setTimelineZoom: (zoom) =>
    set({ timelineZoom: Math.min(500, Math.max(1, zoom)) }),

  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(0, width) }),

  setTimelineHeight: (height) => set({ timelineHeight: Math.max(0, height) }),

  notify: (type, message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: genId(), type, message },
      ],
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
});
