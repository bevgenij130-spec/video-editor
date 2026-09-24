import type { StateCreator } from "zustand";
import type { Project, Track } from "../types";
import { genId } from "../types";

/** Project document state. */
export interface ProjectState {
  project: Project | null;
  projectPath: string | null;
}

/** Project lifecycle actions. */
export interface ProjectActions {
  newProject: (
    name: string,
    fps: number,
    width: number,
    height: number,
  ) => void;
  /** Load a project from disk. The Rust backend performs the actual IO;
   *  until that bridge exists this accepts an already-parsed document via
   *  the optional argument and records only the path otherwise. */
  loadProject: (path: string, project?: Project) => void;
  saveProject: () => void;
  closeProject: () => void;
}

export type ProjectSlice = ProjectState & ProjectActions;

const initialProjectState: ProjectState = {
  project: null,
  projectPath: null,
};

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set) => ({
  ...initialProjectState,

  newProject: (name, fps, width, height) =>
    set(() => {
      const now = new Date().toISOString();
      const project: Project = {
        id: genId(),
        name,
        fps,
        width,
        height,
        tracks: [],
        createdAt: now,
        updatedAt: now,
      };
      return { project, projectPath: null };
    }),

  loadProject: (path, project) =>
    set((state) => {
      const loaded: Project =
        project ??
        state.project ?? {
          id: genId(),
          name: path.split(/[\\/]/).pop() ?? "Untitled",
          fps: 25,
          width: 1920,
          height: 1080,
          tracks: [] as Track[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      return { projectPath: path, project: loaded };
    }),

  saveProject: () =>
    set((state) => {
      if (!state.project) return state;
      const now = new Date().toISOString();
      return {
        project: { ...state.project, updatedAt: now },
        projectPath: state.projectPath ?? `${state.project.name}.vep`,
      };
    }),

  closeProject: () => set(() => ({ ...initialProjectState })),
});
