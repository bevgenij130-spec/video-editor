import type { StateCreator } from "zustand";

/** Project slice — skeleton only (no logic yet). */
export interface ProjectState {
  projectName: string;
  projectPath: string | null;
  /** Timebase of the current project, e.g. 25, 30, 60 fps. */
  timebase: number;
}

export interface ProjectActions {
  // Placeholder: setProject / openProject / saveProject will come later.
  noopProject: () => void;
}

export type ProjectSlice = ProjectState & ProjectActions;

const initialProjectState: ProjectState = {
  projectName: "Untitled",
  projectPath: null,
  timebase: 25,
};

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set) => ({
  ...initialProjectState,
  noopProject: () => set(() => ({})),
});
