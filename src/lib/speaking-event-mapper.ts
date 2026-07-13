import type { NewSpeakingEventRow, SpeakingEventRow } from '../db/schema.js';
import type { SpeakingEvent } from '../types/speaking-event.js';

export function rowToSpeakingEvent(row: SpeakingEventRow): SpeakingEvent {
  return {
    id: row.id,
    image: row.image,
    title: row.title,
    eventType: row.eventType,
    organizer: row.organizer ?? undefined,
    location: row.location ?? undefined,
    eventDate: row.eventDate ?? undefined,
    audienceCount: row.audienceCount ?? undefined,
    link: row.link ?? undefined,
    featured: row.featured,
    sortOrder: row.sortOrder,
  };
}

export function speakingEventToInsertValues(
  data: Omit<SpeakingEvent, 'id'>,
): Omit<NewSpeakingEventRow, 'id'> {
  return {
    image: data.image,
    title: data.title,
    eventType: data.eventType,
    organizer: data.organizer?.trim() || null,
    location: data.location?.trim() || null,
    eventDate: data.eventDate?.trim() || null,
    audienceCount:
      typeof data.audienceCount === 'number' && Number.isFinite(data.audienceCount)
        ? data.audienceCount
        : null,
    link: data.link?.trim() || null,
    featured: data.featured,
    sortOrder: data.sortOrder,
  };
}
