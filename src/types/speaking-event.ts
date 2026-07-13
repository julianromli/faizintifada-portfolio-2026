export type SpeakingEventType = 'offline' | 'webinar';

export interface SpeakingEvent {
  id: number;
  image: string;
  title: string;
  eventType: SpeakingEventType;
  organizer?: string;
  location?: string;
  /** Free-form date string, e.g. "Mar 2025" or an ISO date. */
  eventDate?: string;
  audienceCount?: number;
  /** Optional external link: recap, LinkedIn post, YouTube, etc. */
  link?: string;
  featured: boolean;
  sortOrder: number;
}
