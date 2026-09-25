import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Clip, Track } from "../stores/types";

/** Height of one track lane (px). */
export const TRACK_HEIGHT = 80;
/** Height of the time ruler strip at the top (px). */
export const RULER_HEIGHT = 24;
/** Width of the track-header gutter on the left (px). */
export const CONTENT_LEFT = 120;

/** Colors (0xRRGGBB) used by the timeline renderer. */
const COLOR_BG = 0x0d0d10;
const COLOR_RULER = 0x17171c;
const COLOR_LANE_A = 0x131318;
const COLOR_LANE_B = 0x101014;
const COLOR_CLIP_VIDEO = 0x2563eb; // blue
const COLOR_CLIP_AUDIO = 0x16a34a; // green
const COLOR_CLIP_IMAGE = 0x9333ea; // purple
const COLOR_PLAYHEAD = 0xef4444; // red
const COLOR_SELECTION = 0xffffff; // white
const COLOR_TICK = 0x3f3f46;

/** Everything the renderer needs to draw one frame of the timeline. */
export interface TimelineRenderState {
  tracks: Track[];
  /** Playhead position in seconds. */
  playheadPosition: number;
  /** Horizontal zoom — pixels per second. */
  zoom: number;
  /** Horizontal scroll offset in pixels. */
  scrollX: number;
  selectedClipIds: string[];
  width: number;
  height: number;
}

/** Clip fill color by source type. */
const clipColor = (type: Clip["type"]): number => {
  switch (type) {
    case "video":
      return COLOR_CLIP_VIDEO;
    case "audio":
      return COLOR_CLIP_AUDIO;
    case "image":
      return COLOR_CLIP_IMAGE;
  }
};

/**
 * Pick a tick interval (seconds) so labels stay readable at any zoom:
 * 1s → 5s → 10s → 30s → 60s as zoom decreases.
 */
export const tickIntervalForZoom = (zoom: number): number => {
  if (zoom >= 40) return 1;
  if (zoom >= 12) return 5;
  if (zoom >= 6) return 10;
  if (zoom >= 2) return 30;
  return 60;
};

/** Format a seconds value for a ruler label ("0:05", "1:30"). */
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface ClipEntry {
  rect: Graphics;
  outline: Graphics;
  label: Text;
}

/**
 * Low-level Pixi.js v8 renderer for the timeline.
 *
 * One `Application` (async init bound to a caller-provided canvas), three
 * shared `Graphics` layers (background/lanes + ruler + playhead) redrawn via
 * `clear()` on every `render()`, and a pooled set of clip visuals
 * (rect Graphics + selection-outline Graphics + Text label). Objects are
 * created lazily and reused across frames — nothing is allocated per frame
 * except tiny text/style updates, keeping drag rendering at 60 FPS.
 */
export class TimelineRenderer {
  private readonly app = new Application();
  private readonly root = new Container();
  private readonly bg = new Graphics();
  private readonly ruler = new Graphics();
  private readonly playhead = new Graphics();
  private readonly clipsLayer = new Container();
  private readonly clipPool: ClipEntry[] = [];
  private readonly rulerTexts: Text[] = [];
  private readonly trackNameTexts: Text[] = [];
  private readonly labelStyle = new TextStyle({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 12,
    fill: 0xe4e4e7,
  });
  private readonly rulerStyle = new TextStyle({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 10,
    fill: 0x9ca3af,
  });
  private readonly trackNameStyle = new TextStyle({
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xd4d4d8,
  });
  private destroyed = false;
  /** Gate — render() calls before async init finished are queued, not lost. */
  private ready!: Promise<void>;

  constructor(canvas: HTMLCanvasElement) {
    this.ready = this.init(canvas);
  }

  private async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      view: canvas,
      background: COLOR_BG,
      antialias: false,
      autoDensity: true,
      width: canvas.clientWidth || 800,
      height: canvas.clientHeight || 600,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.root.addChild(this.bg, this.clipsLayer, this.ruler, this.playhead);
    this.app.stage.addChild(this.root);
  }

  /** Draw one frame from the given state. */
  render(state: TimelineRenderState): void {
    if (this.destroyed) return;
    void this.ready.then(() => {
      if (!this.destroyed) this.renderNow(state);
    });
  }

  private renderNow(state: TimelineRenderState): void {
    const { tracks, zoom, scrollX, width, height } = state;
    const selected = new Set(state.selectedClipIds);
    const xOf = (seconds: number): number =>
      CONTENT_LEFT + seconds * zoom - scrollX;

    // ----- background + track lanes ----------------------------------------
    this.bg.clear().rect(0, 0, width, height).fill(COLOR_BG);
    tracks.forEach((track, i) => {
      const y = RULER_HEIGHT + i * TRACK_HEIGHT;
      this.bg
        .rect(CONTENT_LEFT, y, width - CONTENT_LEFT, TRACK_HEIGHT)
        .fill(i % 2 === 0 ? COLOR_LANE_A : COLOR_LANE_B);
      this.bg.rect(CONTENT_LEFT, y + TRACK_HEIGHT - 1, width - CONTENT_LEFT, 1).fill(0x26262c);
      // track header cell + gutter separator
      this.bg.rect(0, y, CONTENT_LEFT, TRACK_HEIGHT).fill(0x1a1a20);
      this.bg.rect(0, y + TRACK_HEIGHT - 1, CONTENT_LEFT, 1).fill(0x26262c);
      void track;
    });
    if (tracks.length > 0) {
      this.bg
        .rect(CONTENT_LEFT - 1, RULER_HEIGHT, 1, height - RULER_HEIGHT)
        .fill(0x2e2e36);
    }
    // Track header labels (name + type badge) drawn in the left gutter.
    tracks.forEach((track, i) => {
      const y = RULER_HEIGHT + i * TRACK_HEIGHT;
      let text = this.trackNameTexts[i];
      if (!text) {
        text = new Text({ text: "", style: this.trackNameStyle });
        this.trackNameTexts[i] = text;
        this.bg.addChild(text);
      }
      text.text = `${track.name}${track.muted ? " · M" : ""}${track.locked ? " · L" : ""}`;
      text.x = 10;
      text.y = y + 10;
      text.visible = true;
    });
    for (let i = tracks.length; i < this.trackNameTexts.length; i++) {
      this.trackNameTexts[i].visible = false;
    }

    // ----- ruler -------------------------------------------------------------
    this.ruler.clear().rect(0, 0, width, RULER_HEIGHT).fill(COLOR_RULER);
    const interval = tickIntervalForZoom(zoom);
    const startSec = Math.max(
      0,
      Math.floor(scrollX / zoom / interval) * interval,
    );
    const endSec = (scrollX + width) / zoom;
    let rulerIdx = 0;
    for (let t = startSec; t <= endSec; t += interval) {
      const x = xOf(t);
      if (x < CONTENT_LEFT) continue;
      this.ruler.rect(x, RULER_HEIGHT - 8, 1, 8).fill(COLOR_TICK);
      let text = this.rulerTexts[rulerIdx];
      if (!text) {
        text = new Text({ text: "", style: this.rulerStyle });
        this.rulerTexts[rulerIdx] = text;
        this.ruler.addChild(text);
      }
      text.text = formatTime(t);
      text.x = x + 4;
      text.y = 5;
      text.visible = true;
      rulerIdx++;
    }
    for (let i = rulerIdx; i < this.rulerTexts.length; i++) {
      this.rulerTexts[i].visible = false;
    }

    // ----- clips --------------------------------------------------------------
    let poolIdx = 0;
    tracks.forEach((track, ti) => {
      const laneY = RULER_HEIGHT + ti * TRACK_HEIGHT;
      for (const clip of track.clips) {
        const x = xOf(clip.start);
        const w = Math.max(2, clip.duration * zoom);
        if (x + w < CONTENT_LEFT || x > width) continue; // off-screen cull
        const y = laneY + 6;
        const h = TRACK_HEIGHT - 18;
        const entry = this.ensureClipEntry(poolIdx++);
        const alpha = track.muted ? 0.35 : 1;

        entry.rect
          .clear()
          .roundRect(x, y, w, h, 4)
          .fill({ color: clipColor(clip.type), alpha })
          .stroke({ width: 1, color: 0x000000, alpha: 0.4 });

        if (selected.has(clip.id)) {
          entry.outline
            .clear()
            .roundRect(x - 1, y - 1, w + 2, h + 2, 5)
            .stroke({ width: 2, color: COLOR_SELECTION });
        } else {
          entry.outline.clear();
        }

        // Ellipsize the label to fit the clip width (measured once per clip,
        // no style objects are allocated per frame).
        const maxTextWidth = Math.max(0, w - 12);
        let shown = clip.name;
        if (entry.label.width > maxTextWidth) {
          while (shown.length > 1 && entry.label.width > maxTextWidth) {
            shown = shown.slice(0, Math.ceil(shown.length / 2));
            entry.label.text = `${shown}…`;
          }
          shown = `${shown}…`;
        }
        entry.label.text = shown;
        entry.label.x = x + 6;
        entry.label.y = y + 4;
        entry.label.visible = w > 16;
      }
    });
    for (let i = poolIdx; i < this.clipPool.length; i++) {
      const e = this.clipPool[i];
      e.rect.clear();
      e.outline.clear();
      e.label.visible = false;
    }

    // ----- playhead -------------------------------------------------------------
    const px = xOf(state.playheadPosition);
    this.playhead
      .clear()
      .rect(px - 1, 0, 2, height)
      .fill(COLOR_PLAYHEAD)
      .poly([px - 5, 0, px + 5, 0, px, 9])
      .fill(COLOR_PLAYHEAD);
  }

  /** Get (or lazily create) the nth pooled clip visual triple. */
  private ensureClipEntry(index: number): ClipEntry {
    let entry = this.clipPool[index];
    if (!entry) {
      const holder = new Container();
      const rect = new Graphics();
      const outline = new Graphics();
      const label = new Text({ text: "", style: this.labelStyle });
      holder.addChild(rect, outline, label);
      this.clipsLayer.addChild(holder);
      entry = { rect, outline, label };
      this.clipPool[index] = entry;
    }
    return entry;
  }

  /** Destroy the Pixi application and all GPU resources. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    void this.ready.then(() => {
      this.app.destroy(true, { children: true, texture: true });
    });
  }
}
