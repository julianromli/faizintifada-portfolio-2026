import { Microphone, MapPin, Users, VideoCamera } from '@phosphor-icons/react';
import type { SpeakingStatsData } from './speaking-stats-core';

export type { SpeakingStatsData } from './speaking-stats-core';
export { computeSpeakingStats } from './speaking-stats-core';

export interface SpeakingStat {
  icon: typeof Microphone;
  value: string;
  label: string;
}

/** Maps server stats into the homepage / speaking page stat strip. */
export function speakingStatsToStrip(stats: SpeakingStatsData): SpeakingStat[] {
  if (stats.totalEvents === 0) return [];

  const formatCount = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${n}+`);

  const result: SpeakingStat[] = [
    { icon: Microphone, value: `${stats.totalEvents}+`, label: 'Events & talks' },
  ];
  if (stats.totalAudience > 0) {
    result.push({ icon: Users, value: formatCount(stats.totalAudience), label: 'Audience reached' });
  }
  result.push({
    icon: stats.hasWebinar && stats.hasOffline ? MapPin : stats.hasWebinar ? VideoCamera : MapPin,
    value: stats.hasWebinar && stats.hasOffline ? 'Offline & Online' : stats.hasWebinar ? 'Online' : 'Offline',
    label: 'Formats',
  });
  return result;
}
