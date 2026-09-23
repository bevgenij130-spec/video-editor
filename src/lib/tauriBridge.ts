import { invoke } from "@tauri-apps/api/core";

/**
 * Thin typed bridge over Tauri `invoke`. All frontend -> Rust calls
 * should go through this module. Skeleton only.
 */
export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name });
}

// Placeholder: projectOpen / mediaImport / playbackSeek / exportStart bridges
// will be added here as backend commands are implemented.
