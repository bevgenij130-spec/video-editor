/**
 * Shared editor data model types (frontend mirror of the Rust project schema).
 * Kept in one place so slices and components can import without cycles.
 */

export type TrackType = "video" | "audio";
export type ClipType = "video" | "audio" | "image";

/** A single clip placed on a track. All times are in seconds. */
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  /** Position on the timeline (seconds). */
  start: number;
  /** Length on the timeline (seconds). */
  duration: number;
  /** In-point inside the source media (seconds). */
  sourceStart: number;
  /** Total length of the source media (seconds). */
  sourceDuration: number;
  type: ClipType;
}

/** A video or audio track containing ordered clips. */
export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
}

/** Editor project document. */
export interface Project {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

/** An item in the media library pool. */
export interface MediaItem {
  id: string;
  name: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  type: ClipType;
  thumbnail?: string;
}

/** Transient UI notification. */
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

/** Generate a reasonably unique id without external deps. */
export const genId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
