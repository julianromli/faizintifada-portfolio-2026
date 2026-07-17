import { useMemo } from 'react';
import { ArrowRight, Microphone, MapPin, Users, VideoCamera } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { SpeakingEvent } from '../types/speaking-event';
import { useSpeakingEvents } from '../hooks/useSpeakingEvents';
import { SpeakingGallery } from './SpeakingGallery';

const HOME_EVENT_LIMIT = 9;

interface Stat {
  icon: typeof Microphone;
  value: string;
  label: string;
}

/** Derives the credibility stat strip from all featured events. */
export function deriveSpeakingStats(events: SpeakingEvent[]): Stat[] {
  if (events.length === 0) return [];
  const totalAudience = events.reduce((sum, e) => sum + (e.audienceCount ?? 0), 0);
  const hasWebinar = events.some((e) => e.eventType === 'webinar');
  const hasOffline = events.some((e) => e.eventType === 'offline');

  const formatCount = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${n}+`);

  const result: Stat[] = [
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

export function SpeakingStatStrip({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3">
            <Icon size={22} className="text-foreground" weight="regular" aria-hidden="true" />
            <div>
              <p className="text-[18px] font-semibold leading-none text-foreground">{stat.value}</p>
              <p className="mt-1 text-[13px] font-medium text-muted">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SpeakingEvents() {
  const { events, loading, error } = useSpeakingEvents({ featuredOnly: true });

  // Stats reflect all featured events; the grid is capped for the homepage.
  const stats = useMemo(() => deriveSpeakingStats(events), [events]);

  if (loading || error || events.length === 0) {
    return null;
  }

  const visibleEvents = events.slice(0, HOME_EVENT_LIMIT);
  const hasMore = events.length > HOME_EVENT_LIMIT;

  return (
    <section id="speaking">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Speaking &amp; Events</h2>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="max-w-md text-[15px] font-medium leading-relaxed text-muted">
              Sharing about AI at offline events and online webinars — from hands-on workshops to keynote talks.
            </p>
            {hasMore && (
              <Link
                to="/speaking"
                className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition group"
              >
                <span>View all</span>
                <ArrowRight size={16} className="text-muted group-hover:text-foreground theme-transition" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <SpeakingStatStrip stats={stats} />

      <SpeakingGallery events={visibleEvents} />
    </section>
  );
}
