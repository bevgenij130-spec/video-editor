import type { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";
import { temporal, type TemporalState, type ZundoOptions } from "zundo";
import type { Project, Track } from "./types";

/** The portion of editor state that participates in undo/redo history. */
export interface HistoryTrackedState {
  project: Project | null;
  tracks: Track[];
}

/** Options accepted by {@link withHistory}. */
export interface WithHistoryOptions<T> {
  /** Max number of history entries (default 100). */
  limit?: number;
  /** Override what gets snapshotted into history. Defaults to
   *  `{ project, tracks }` only — uiSlice / playbackSlice are excluded. */
  partialize?: (state: T) => HistoryTrackedState;
}

/** Default snapshot: only document data goes into the undo stack. */
export const historyPartialize = <T extends HistoryTrackedState>(
  state: T,
): HistoryTrackedState => ({ project: state.project, tracks: state.tracks });

/** Mutator tag zundo v2 attaches to the store creator chain. */
type TemporalMuts = [
  ["temporal", StoreApi<TemporalState<HistoryTrackedState>>],
];

/**
 * Wrap an editor store creator with zundo `temporal` history, restricted to
 * the project/timeline document slices. Playback and UI state never land in
 * the undo stack thanks to `partialize`.
 */
export const withHistory = <
  T extends HistoryTrackedState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, [...Mps, ["temporal", unknown]], Mcs>,
  options: WithHistoryOptions<T> = {},
): StateCreator<T, Mps, [...TemporalMuts, ...Mcs]> => {
  const partialize = options.partialize ?? historyPartialize;
  const zundoOptions: ZundoOptions<T, HistoryTrackedState> = {
    partialize,
    limit: options.limit ?? 100,
    // Skip pushing a history entry when the tracked (document) part of the
    // state is unchanged — pure UI / playback / selection updates must not
    // pollute the undo stack.
    equality: (pastState, currentState) =>
      pastState.project === currentState.project &&
      pastState.tracks === currentState.tracks,
  };
  return temporal<T, Mps, Mcs, HistoryTrackedState>(config, zundoOptions);
};
