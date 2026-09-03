import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useSpeakingEvents } from '../hooks/useSpeakingEvents';
import { speakingStatsToStrip, type SpeakingStat } from '../lib/speaking-stats';
import { SpeakingGallery } from './SpeakingGallery';
import { Skeleton } from './Skeleton';

const HOME_EVENT_LIMIT = 9;

export function SpeakingStatStrip({ stats }: { stats: SpeakingStat[] }) {
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

/** Reserves the section's real height while the events load, so nothing below shifts. */
function SpeakingEventsSkeleton() {
  return (
    <section id="speaking">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            Speaking &amp; Events
          </h2>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="max-w-md text-[15px] font-medium leading-relaxed text-muted">
              Sharing about AI at offline events and online webinars — from hands-on workshops to keynote talks.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4">
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex items-center gap-3">
            <Skeleton variant="circle" className="size-[22px]" style={{ animationDelay: `${k * 80}ms` }} />
            <div>
              <Skeleton variant="text" className="w-12" style={{ animationDelay: `${k * 80}ms` }} />
              <Skeleton
                variant="text"
                muted
                className="mt-1 h-3 w-20"
                style={{ animationDelay: `${k * 80}ms` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 auto-rows-auto">
        {Array.from({ length: HOME_EVENT_LIMIT }, (_, k) => (
          <Skeleton
            key={k}
            className={`rounded-[1.25rem] ${
              k === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto' : 'aspect-[4/3]'
            }`}
            style={{ animationDelay: `${k * 60}ms` }}
          />
        ))}
      </div>
    </section>
  );
}

export function SpeakingEvents() {
  const { events, stats, loading, error } = useSpeakingEvents({
    featuredOnly: true,
    limit: HOME_EVENT_LIMIT,
  });

  if (loading) {
    return <SpeakingEventsSkeleton />;
  }

  if (error || events.length === 0) {
    return null;
  }

  const statStrip = speakingStatsToStrip(stats);
  const hasMore = stats.totalEvents > events.length;

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

      <SpeakingStatStrip stats={statStrip} />

      <SpeakingGallery events={events} />
    </section>
  );
}
