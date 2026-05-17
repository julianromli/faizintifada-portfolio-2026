import { useCallback, useEffect, useState } from 'react';
import type { YouTubeVideo } from '../types/youtube';
import { apiUrl } from '../lib/api';

interface UseYouTubeVideosState {
  videos: YouTubeVideo[];
  loading: boolean;
  error: Error | null;
}

export function useYouTubeVideos(options?: { limit?: number }): UseYouTubeVideosState & {
  retry: () => void;
} {
  const limit = options?.limit ?? 3;
  const [state, setState] = useState<UseYouTubeVideosState>({
    videos: [],
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const qs = new URLSearchParams({ limit: String(limit) });
      const res = await fetch(apiUrl(`/api/youtube/videos?${qs.toString()}`));
      if (!res.ok) {
        throw new Error(`YouTube videos request failed (${res.status})`);
      }

      const data = (await res.json()) as YouTubeVideo[];
      setState({ videos: data, loading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ videos: [], loading: false, error });
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
