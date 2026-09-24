import type { StateCreator } from "zustand";

/** UI slice — skeleton only (panels, modals, tool selection come later). */
export type ActiveTool = "select" | "razor" | "hand";

export interface UiState {
  activeTool: ActiveTool;
  sidebarWidth: number;
  timelineHeight: number;
}

export interface UiActions {
  // Placeholder: setActiveTool / resize panels will come later.
  noopUi: () => void;
}

export type UiSlice = UiState & UiActions;

const initialUiState: UiState = {
  activeTool: "select",
  sidebarWidth: 56,
  timelineHeight: 260,
};

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (set) => ({
  ...initialUiState,
  noopUi: () => set(() => ({})),
});
