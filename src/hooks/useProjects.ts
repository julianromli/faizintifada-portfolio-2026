import { useCallback, useEffect, useState } from 'react';
import type { ProjectSummary } from '../types/project';
import { apiUrl } from '../lib/api';

interface UseProjectsState {
  projects: ProjectSummary[];
  loading: boolean;
  error: Error | null;
}

export function useProjects(options?: { featuredOnly?: boolean }): UseProjectsState & {
  retry: () => void;
} {
  const featuredOnly = options?.featuredOnly ?? false;
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const qs = featuredOnly ? '?featured=1' : '';
        const res = await fetch(apiUrl(`/api/projects${qs}`), { signal });
        if (!res.ok) {
          throw new Error(`Projects request failed (${res.status})`);
        }
        const data = (await res.json()) as ProjectSummary[];
        if (signal.aborted) return;
        setState({ projects: data, loading: false, error: null });
      } catch (e) {
        if (signal.aborted) return;
        const error = e instanceof Error ? e : new Error(String(e));
        setState({ projects: [], loading: false, error });
      }
    },
    [featuredOnly],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
