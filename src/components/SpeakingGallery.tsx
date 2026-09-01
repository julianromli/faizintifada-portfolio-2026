import { useState } from 'react';
import { Microphone, VideoCamera } from '@phosphor-icons/react';
import { m } from 'motion/react';
import type { SpeakingEvent } from '../types/speaking-event';
import { ImageLightbox } from './ImageLightbox';
import { EASE_OUT } from '../lib/motion';

/** Bento tile sizing: the first item spans two columns/rows on larger screens. */
function tileSpanClass(index: number): string {
  if (index === 0) {
    return 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto';
  }
  return 'aspect-[4/3]';
}

function EventBadge({ type }: { type: SpeakingEvent['eventType'] }) {
  const isWebinar = type === 'webinar';
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black backdrop-blur">
      {isWebinar ? (
        <VideoCamera size={12} weight="fill" aria-hidden="true" />
      ) : (
        <Microphone size={12} weight="fill" aria-hidden="true" />
      )}
      {isWebinar ? 'Webinar' : 'Offline'}
    </span>
  );
}

interface EventTileProps {
  event: SpeakingEvent;
  index: number;
  onOpen: () => void;
}

function EventTile({ event, index, onOpen }: EventTileProps) {
  const meta = [event.location, event.eventDate].filter(Boolean).join(' · ');

  return (
    <m.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: Math.min(index, 6) * 0.08 }}
      className={`group relative block w-full overflow-hidden rounded-[1.25rem] bg-surface-nested text-left transition-shadow duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 ${tileSpanClass(index)}`}
      aria-label={`View photo: ${event.title}`}
    >
      <img
        src={event.image}
        alt={event.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
      />

      {/* Top-left type badge */}
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <EventBadge type={event.eventType} />
      </div>

      {/* Bottom gradient + text overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-10">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
          {event.title}
        </h3>
        {(event.organizer || meta) && (
          <p className="mt-1 line-clamp-1 text-[12px] font-medium text-white/75">
            {[event.organizer, meta].filter(Boolean).join(' — ')}
          </p>
        )}
      </div>
    </m.button>
  );
}

interface SpeakingGalleryProps {
  events: SpeakingEvent[];
}

/** Bento grid of speaking events with a shared lightbox. Reused by the homepage
 *  section and the /speaking page. */
export function SpeakingGallery({ events }: SpeakingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeEvent = activeIndex !== null ? events[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 auto-rows-auto">
        {events.map((event, index) => (
          <EventTile
            key={event.id}
            event={event}
            index={index}
            onOpen={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {activeEvent && (
        <ImageLightbox
          src={activeEvent.image}
          alt={activeEvent.title}
          onClose={() => setActiveIndex(null)}
          onPrev={
            activeIndex! > 0
              ? () => setActiveIndex((i) => (i === null ? i : Math.max(0, i - 1)))
              : undefined
          }
          onNext={
            activeIndex! < events.length - 1
              ? () => setActiveIndex((i) => (i === null ? i : Math.min(events.length - 1, i + 1)))
              : undefined
          }
        />
      )}
    </>
  );
}
