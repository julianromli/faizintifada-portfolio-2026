import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useSpeakingEvents } from '../hooks/useSpeakingEvents';
import { SpeakingGallery } from '../components/SpeakingGallery';
import { SpeakingStatStrip } from '../components/SpeakingEvents';
import { speakingStatsToStrip } from '../lib/speaking-stats';
import { Seo } from '../components/Seo';

export function Speaking() {
  const { events, stats, loading, error, retry } = useSpeakingEvents({ featuredOnly: true });
  const statStrip = speakingStatsToStrip(stats);

  return (
    <>
      <Seo
        title="Speaking & Events"
        description="AI talks, keynotes, and webinars by Faiz Intifada — offline events and online sessions about building with AI."
        path="/speaking"
      />
      <main className="space-y-10 pb-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground active:scale-95 theme-transition group mb-4"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform duration-200 ease-out"
            />
            <span>Back to home</span>
          </Link>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            AI Speaker
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Speaking &amp; Events</h1>
          <p className="text-[15px] text-muted mt-2 max-w-lg">
            Every talk, keynote, and webinar — offline and online — where I shared about building with AI.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-[1.25rem] bg-surface-nested"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4 text-[15px] text-red-800">
            <p className="font-medium">Could not load speaking events.</p>
            <p className="text-red-700/90 mt-1">{error.message}</p>
            <button
              type="button"
              onClick={() => retry()}
              className="mt-3 text-[14px] font-semibold underline decoration-red-800/40 hover:decoration-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="text-[15px] text-muted">No speaking events yet.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <>
            <SpeakingStatStrip stats={statStrip} />
            <SpeakingGallery events={events} />
          </>
        )}
      </main>
    </>
  );
}
