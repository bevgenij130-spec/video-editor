import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PreviewCanvas } from "./components/Preview/PreviewCanvas";
import { TransportControls } from "./components/Controls/TransportControls";
import { TimelinePixi } from "./components/Timeline/TimelinePixi";

/** Editor skeleton layout: sidebar | (preview over timeline), full window. */
function App() {
  useEffect(() => {
    invoke<string>("greet", { name: "editor" })
      .then((msg) => console.log(msg))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex h-screen w-screen select-none overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Left vertical tool sidebar */}
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-zinc-800 bg-zinc-900 py-3">
        <button type="button" className="h-9 w-9 rounded bg-zinc-800 text-sm hover:bg-zinc-700" title="Select">
          ▸
        </button>
        <button type="button" className="h-9 w-9 rounded bg-zinc-800 text-sm hover:bg-zinc-700" title="Razor">
          ✂
        </button>
        <button type="button" className="h-9 w-9 rounded bg-zinc-800 text-sm hover:bg-zinc-700" title="Hand">
          ✋
        </button>
      </aside>

      {/* Main column: preview on top, timeline at bottom */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Preview area (dark) */}
        <section className="min-h-0 flex-1 bg-zinc-900">
          <PreviewCanvas />
        </section>

        <TransportControls />

        {/* Timeline area (darker) */}
        <section className="h-64 shrink-0 border-t border-zinc-800 bg-[#0d0d10]">
          <TimelinePixi />
        </section>
      </main>
    </div>
  );
}

export default App;
