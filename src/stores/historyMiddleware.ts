import type { StateCreator } from "zustand";
import { temporal, type TemporalState, type Zundo } from "zundo";

/**
 * History (undo/redo) middleware — skeleton only.
 * Wraps the editor store with zundo (immer-friendly). Actual
 * undo/redo wiring and selective partialization come later.
 */
export const historyMiddleware = <T extends object>(
  config: StateCreator<T, [], []>,
) => temporal(config);

export type { TemporalState, Zundo };
