import { useCallback, useEffect, useState } from 'react';
import type { SpeakingEvent } from '../types/speaking-event';
import type { SpeakingStatsData } from '../lib/speaking-stats';
import { apiUrl } from '../lib/api';

interface UseSpeakingEventsState {
  events: SpeakingEvent[];
  stats: SpeakingStatsData;
  loading: boolean;
  error: Error | null;
}

const EMPTY_STATS: SpeakingStatsData = {
  totalEvents: 0,
  totalAudience: 0,
  hasWebinar: false,
  hasOffline: false,
};

export function useSpeakingEvents(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): UseSpeakingEventsState & {
  retry: () => void;
} {
  const featuredOnly = options?.featuredOnly ?? false;
  const limit = options?.limit;
  const [state, setState] = useState<UseSpeakingEventsState>({
    events: [],
    stats: EMPTY_STATS,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (featuredOnly) params.set('featured', '1');
        if (limit !== undefined && limit > 0) params.set('limit', String(limit));
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(apiUrl(`/api/speaking-events${qs}`), { signal });
        if (!res.ok) {
          throw new Error(`Speaking events request failed (${res.status})`);
        }
        const data = (await res.json()) as { events: SpeakingEvent[]; stats: SpeakingStatsData };
        if (signal.aborted) return;
        setState({ events: data.events, stats: data.stats, loading: false, error: null });
      } catch (e) {
        if (signal.aborted) return;
        const error = e instanceof Error ? e : new Error(String(e));
        setState({ events: [], stats: EMPTY_STATS, loading: false, error });
      }
    },
    [featuredOnly, limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
