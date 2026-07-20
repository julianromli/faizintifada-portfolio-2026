import type { SpeakingEvent } from '../types/speaking-event.js';

export interface SpeakingStatsData {
  totalEvents: number;
  totalAudience: number;
  hasWebinar: boolean;
  hasOffline: boolean;
}

/** Computes aggregate stats from the full featured (or filtered) event set. */
export function computeSpeakingStats(events: SpeakingEvent[]): SpeakingStatsData {
  return {
    totalEvents: events.length,
    totalAudience: events.reduce((sum, e) => sum + (e.audienceCount ?? 0), 0),
    hasWebinar: events.some((e) => e.eventType === 'webinar'),
    hasOffline: events.some((e) => e.eventType === 'offline'),
  };
}
