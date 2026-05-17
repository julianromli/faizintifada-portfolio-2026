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

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(apiUrl('/api/github/contributions'));
      if (!res.ok) {
        throw new Error(`GitHub contributions request failed (${res.status})`);
      }

      const data = (await res.json()) as GitHubContributions;
      setState({ contributions: data, loading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ contributions: null, loading: false, error });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
