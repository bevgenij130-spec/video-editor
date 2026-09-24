import { useCallback, useState } from "react";
import { invoke, type InvokeArgs } from "@tauri-apps/api/core";

interface UseTauriCommandResult<TArgs extends InvokeArgs, TResult> {
  result: TResult | null;
  error: string | null;
  loading: boolean;
  /** Invoke the command with args. Skeleton wrapper over `invoke`. */
  run: (args: TArgs) => Promise<TResult | null>;
}

/**
 * Generic hook for calling a Tauri command without blocking the UI.
 * Skeleton only — no caching/abort logic yet.
 */
export function useTauriCommand<TArgs extends InvokeArgs, TResult>(
  command: string,
): UseTauriCommandResult<TArgs, TResult> {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await invoke<TResult>(command, args);
        setResult(res);
        return res;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [command],
  );

  return { result, error, loading, run };
}
