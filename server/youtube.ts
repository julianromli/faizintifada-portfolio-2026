import { XMLParser } from 'fast-xml-parser';
import type { YouTubeVideo } from '../src/types/youtube.js';

const YOUTUBE_HANDLE = 'faizintifada';
const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/@${YOUTUBE_HANDLE}`;
const YOUTUBE_FEED_URL = 'https://www.youtube.com/feeds/videos.xml';
const DEFAULT_VIDEO_LIMIT = 3;
const MIN_VIDEO_LIMIT = 1;
const MAX_VIDEO_LIMIT = 12;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

interface YouTubeFeed {
  feed?: {
    entry?: YouTubeFeedEntry | YouTubeFeedEntry[];
  };
}

interface YouTubeFeedEntry {
  id?: string;
  title?: string;
  published?: string;
  link?: {
    href?: string;
  };
  'media:group'?: {
    'media:thumbnail'?: {
      url?: string;
    };
  };
}

export function parseVideoLimit(value: string | undefined): number {
  if (!value) {
    return DEFAULT_VIDEO_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_VIDEO_LIMIT;
  }

  return Math.min(Math.max(parsed, MIN_VIDEO_LIMIT), MAX_VIDEO_LIMIT);
}

export async function fetchLatestYouTubeVideos(limit: number): Promise<YouTubeVideo[]> {
  const channelId = await resolveChannelId();
  const feedUrl = new URL(YOUTUBE_FEED_URL);
  feedUrl.searchParams.set('channel_id', channelId);

  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`YouTube feed request failed (${response.status})`);
  }

  return parseYouTubeFeed(await response.text()).slice(0, limit);
}

function parseYouTubeFeed(xml: string): YouTubeVideo[] {
  const feed = parser.parse(xml) as YouTubeFeed;
  const entries = toArray(feed.feed?.entry);

  return entries.flatMap((entry) => {
    const id = getVideoId(entry);
    const title = entry.title?.trim();
    const url = entry.link?.href ?? (id ? `https://www.youtube.com/watch?v=${id}` : undefined);
    const thumbnailUrl =
      entry['media:group']?.['media:thumbnail']?.url ??
      (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined);
    const publishedAt = entry.published;

    if (!id || !title || !url || !thumbnailUrl || !publishedAt) {
      return [];
    }

    return [{ id, title, url, thumbnailUrl, publishedAt }];
  });
}

async function resolveChannelId(): Promise<string> {
  const response = await fetch(YOUTUBE_CHANNEL_URL);
  if (!response.ok) {
    throw new Error(`YouTube channel request failed (${response.status})`);
  }

  const html = await response.text();
  const channelId = html.match(/"channelId":"(UC[^"]+)"/)?.[1] ?? html.match(/"externalId":"(UC[^"]+)"/)?.[1];

  if (!channelId) {
    throw new Error('Could not resolve YouTube channel ID');
  }

  return channelId;
}

function getVideoId(entry: YouTubeFeedEntry): string | undefined {
  const rawId = entry.id;
  if (rawId?.startsWith('yt:video:')) {
    return rawId.replace('yt:video:', '');
  }

  const watchUrl = entry.link?.href;
  if (!watchUrl) {
    return rawId;
  }

  try {
    return new URL(watchUrl).searchParams.get('v') ?? rawId;
  } catch {
    return rawId;
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
