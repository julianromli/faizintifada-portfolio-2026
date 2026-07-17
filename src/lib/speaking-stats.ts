import { Microphone, MapPin, Users, VideoCamera } from '@phosphor-icons/react';
import type { SpeakingEvent } from '../types/speaking-event';

export interface SpeakingStat {
  icon: typeof Microphone;
  value: string;
  label: string;
}

/** Derives the credibility stat strip from all featured events. */
export function deriveSpeakingStats(events: SpeakingEvent[]): SpeakingStat[] {
  if (events.length === 0) return [];
  const totalAudience = events.reduce((sum, e) => sum + (e.audienceCount ?? 0), 0);
  const hasWebinar = events.some((e) => e.eventType === 'webinar');
  const hasOffline = events.some((e) => e.eventType === 'offline');

  const formatCount = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${n}+`);

  const result: SpeakingStat[] = [
    { icon: Microphone, value: `${events.length}+`, label: 'Events & talks' },
  ];
  if (totalAudience > 0) {
    result.push({ icon: Users, value: formatCount(totalAudience), label: 'Audience reached' });
  }
  result.push({
    icon: hasWebinar && hasOffline ? MapPin : hasWebinar ? VideoCamera : MapPin,
    value: hasWebinar && hasOffline ? 'Offline & Online' : hasWebinar ? 'Online' : 'Offline',
    label: 'Formats',
  });
  return result;
}
