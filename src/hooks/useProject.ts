import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../types/project';
import { apiUrl } from '../lib/api';

interface UseProjectState {
  project: Project | undefined | null;
  loading: boolean;
  error: Error | null;
}

/** Null slug skips fetching until slug exists */
export function useProject(slug: string | undefined): UseProjectState & {
  retry: () => void;
} {
  const [state, setState] = useState<UseProjectState>({
    project: undefined,
    loading: Boolean(slug),
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    if (!slug) {
      setState({ project: undefined, loading: false, error: null });
      return;
    }

    setState({ project: undefined, loading: true, error: null });
    try {
      const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(slug)}`));
      if (res.status === 404) {
        setState({ project: null, loading: false, error: null });
        return;
      }
      if (!res.ok) {
        throw new Error(`Project request failed (${res.status})`);
      }
      const data = (await res.json()) as Project;
      setState({ project: data, loading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ project: undefined, loading: false, error });
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
