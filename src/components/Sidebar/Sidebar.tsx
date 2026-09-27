import { useEditorActions, useTimeline, useUI } from "../../stores/editorStore";
import type { ActiveTool } from "../../stores/slices/uiSlice";

/** Shared button classes for the dark sidebar theme. */
const BTN =
  "flex h-9 w-full items-center justify-center gap-1 rounded bg-zinc-800 text-sm text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40";

/** Small section caption between button groups. */
const GROUP_LABEL =
  "mt-3 mb-1 select-none border-t border-zinc-800 pt-2 text-center text-[10px] uppercase tracking-wide text-zinc-500";

interface ToolDef {
  id: ActiveTool;
  icon: string;
  label: string;
}

const TOOLS: ToolDef[] = [
  { id: "select", icon: "▸", label: "Select" },
  { id: "razor", icon: "✂", label: "Razor" },
  { id: "hand", icon: "✋", label: "Hand" },
];

/**
 * Left vertical tool panel: active-tool switcher, track add/remove buttons.
 * All mutations go through store actions so they participate in undo/redo
 * exactly like programmatic edits (e.g. `useEditorActions().addTrack('video')`).
 */
export function Sidebar() {
  const { activeTool } = useUI();
  const { tracks, selectedClipIds, selectedTrackId } = useTimeline();
  const { setActiveTool, addTrack, removeTrack } = useEditorActions();

  /** Remove target: track of the first selected clip -> selected track -> last track. */
  const removableTrackId: string | null = (() => {
    if (selectedClipIds.length > 0) {
      const firstClipId = selectedClipIds[0];
      const owner = tracks.find((t) =>
        t.clips.some((c) => c.id === firstClipId),
      );
      if (owner) return owner.id;
    }
    if (
      selectedTrackId !== null &&
      tracks.some((t) => t.id === selectedTrackId)
    ) {
      return selectedTrackId;
    }
    return tracks.length > 0 ? tracks[tracks.length - 1].id : null;
  })();

  return (
    <aside className="flex w-14 shrink-0 flex-col gap-1 overflow-y-auto border-r border-zinc-800 bg-zinc-900 px-1.5 py-3">
      {/* Group 1 — tools */}
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={`${tool.label} tool`}
          onClick={() => setActiveTool(tool.id)}
          className={`${BTN} ${
            activeTool === tool.id
              ? "!bg-blue-600 text-white hover:!bg-blue-500"
              : ""
          }`}
        >
          {tool.icon}
        </button>
      ))}

      {/* Group 2 — add tracks */}
      <div className={GROUP_LABEL}>Add</div>
      <button
        type="button"
        title="Add video track"
        onClick={() => addTrack("video")}
        className={BTN}
      >
        <span aria-hidden>+🎬</span>
      </button>
      <button
        type="button"
        title="Add audio track"
        onClick={() => addTrack("audio")}
        className={BTN}
      >
        <span aria-hidden>+🎧</span>
      </button>

      {/* Group 3 — remove */}
      <div className={GROUP_LABEL}>Edit</div>
      <button
        type="button"
        title="Remove track"
        disabled={removableTrackId === null}
        onClick={() => {
          if (removableTrackId !== null) removeTrack(removableTrackId);
        }}
        className={BTN}
      >
        −
      </button>
    </aside>
  );
}

export default Sidebar;
