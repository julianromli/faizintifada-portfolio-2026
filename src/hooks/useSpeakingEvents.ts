import { useCallback, useEffect, useState } from 'react';
import type { SpeakingEvent } from '../types/speaking-event';
import { apiUrl } from '../lib/api';

interface UseSpeakingEventsState {
  events: SpeakingEvent[];
  loading: boolean;
  error: Error | null;
}

export function useSpeakingEvents(options?: { featuredOnly?: boolean }): UseSpeakingEventsState & {
  retry: () => void;
} {
  const featuredOnly = options?.featuredOnly ?? false;
  const [state, setState] = useState<UseSpeakingEventsState>({
    events: [],
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const qs = featuredOnly ? '?featured=1' : '';
      const res = await fetch(apiUrl(`/api/speaking-events${qs}`));
      if (!res.ok) {
        throw new Error(`Speaking events request failed (${res.status})`);
      }
      const data = (await res.json()) as SpeakingEvent[];
      setState({ events: data, loading: false, error: null });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ events: [], loading: false, error });
    }
  }, [featuredOnly]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const retry = () => setNonce((n) => n + 1);

  return { ...state, retry };
}
