import { useEditorStore } from "../../stores/editorStore";

/**
 * Transport bar (play/pause/seek) — skeleton buttons wired to store state.
 */
export function TransportControls() {
  const isPlaying = useEditorStore((s) => s.isPlaying);

  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <button
        type="button"
        className="rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <span className="font-mono text-xs text-zinc-400">00:00:00:00</span>
    </div>
  );
}

export default TransportControls;
