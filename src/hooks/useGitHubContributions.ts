import { useCallback, useEffect, useState } from 'react';
import type { GitHubContributions } from '../types/github';
import { apiUrl } from '../lib/api';

interface UseGitHubContributionsState {
  contributions: GitHubContributions | null;
  loading: boolean;
  error: Error | null;
}

export function useGitHubContributions(): UseGitHubContributionsState & {
  retry: () => void;
} {
  const [state, setState] = useState<UseGitHubContributionsState>({
    contributions: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(apiUrl('/api/github/contributions'), { signal });
      if (!res.ok) {
        throw new Error(`GitHub contributions request failed (${res.status})`);
      }

      const data = (await res.json()) as GitHubContributions;
      if (signal.aborted) return;
      setState({ contributions: data, loading: false, error: null });
    } catch (e) {
      if (signal.aborted) return;
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ contributions: null, loading: false, error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
