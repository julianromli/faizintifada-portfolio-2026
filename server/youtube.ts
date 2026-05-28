import { XMLParser } from 'fast-xml-parser';
import type { YouTubeVideo } from '../src/types/youtube.js';

const DEFAULT_HANDLE = 'faizintifada';
const YOUTUBE_FEED_URL = 'https://www.youtube.com/feeds/videos.xml';
const DEFAULT_VIDEO_LIMIT = 3;
const MIN_VIDEO_LIMIT = 1;
const MAX_VIDEO_LIMIT = 12;

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
} as const;

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

interface YouTubeApiSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
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

function getChannelHandle(): string {
  return process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || DEFAULT_HANDLE;
}

function getConfiguredChannelId(): string | undefined {
  const id = process.env.YOUTUBE_CHANNEL_ID?.trim();
  return id?.startsWith('UC') ? id : undefined;
}

function getApiKey(): string | undefined {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key || undefined;
}

export async function fetchLatestYouTubeVideos(limit: number): Promise<YouTubeVideo[]> {
  const channelId = getConfiguredChannelId() ?? (await resolveChannelId());
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const videos = await fetchViaYouTubeApi(channelId, limit, apiKey);
      console.log('[youtube] provider=api');
      return videos;
    } catch (apiError) {
      console.warn('[youtube] api failed, trying rss', apiError);
    }
  }

  try {
    const videos = await fetchViaRss(channelId, limit);
    console.log('[youtube] provider=rss');
    return videos;
  } catch (rssError) {
    throw rssError;
  }
}

async function fetchViaRss(channelId: string, limit: number): Promise<YouTubeVideo[]> {
  const feedUrl = await resolveFeedUrl(channelId);
  const response = await fetch(feedUrl, {
    headers: {
      ...FETCH_HEADERS,
      Accept: 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`YouTube feed request failed (${response.status})`);
  }

  const videos = parseYouTubeFeed(await response.text());
  if (videos.length === 0) {
    throw new Error('YouTube feed returned no videos');
  }

  return videos.slice(0, limit);
}

async function resolveFeedUrl(channelId: string): Promise<string> {
  const configuredFeed = process.env.YOUTUBE_FEED_URL?.trim();
  if (configuredFeed) {
    return configuredFeed;
  }

  const handle = getChannelHandle();
  const channelUrl = `https://www.youtube.com/@${handle}`;
  const response = await fetch(channelUrl, { headers: FETCH_HEADERS });
  if (!response.ok) {
    return buildFeedUrl(channelId);
  }

  const html = await response.text();
  const fromLink =
    html.match(
      /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<link[^>]+href=["'](https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=[^"']+)["'][^>]+rel=["']alternate["']/i,
    )?.[1];

  return fromLink ?? buildFeedUrl(channelId);
}

function buildFeedUrl(channelId: string): string {
  const feedUrl = new URL(YOUTUBE_FEED_URL);
  feedUrl.searchParams.set('channel_id', channelId);
  return feedUrl.toString();
}

async function resolveChannelId(): Promise<string> {
  const handle = getChannelHandle();
  const channelUrl = `https://www.youtube.com/@${handle}`;
  const response = await fetch(channelUrl, { headers: FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`YouTube channel request failed (${response.status})`);
  }

  const html = await response.text();
  const fromFeedLink = html.match(/feeds\/videos\.xml\?channel_id=(UC[^"&]+)/)?.[1];
  const channelId =
    fromFeedLink ??
    html.match(/"channelId":"(UC[^"]+)"/)?.[1] ??
    html.match(/"externalId":"(UC[^"]+)"/)?.[1];

  if (!channelId) {
    throw new Error('Could not resolve YouTube channel ID');
  }

  return channelId;
}

async function fetchViaYouTubeApi(
  channelId: string,
  limit: number,
  apiKey: string,
): Promise<YouTubeVideo[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('order', 'date');
  url.searchParams.set('maxResults', String(limit));
  url.searchParams.set('type', 'video');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube Data API request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as YouTubeApiSearchResponse;
  const videos = (data.items ?? []).flatMap((item) => {
    const id = item.id?.videoId;
    const snippet = item.snippet;
    const title = snippet?.title?.trim();
    const publishedAt = snippet?.publishedAt;
    const thumbnailUrl =
      snippet?.thumbnails?.high?.url ??
      snippet?.thumbnails?.medium?.url ??
      snippet?.thumbnails?.default?.url;

    if (!id || !title || !publishedAt || !thumbnailUrl) {
      return [];
    }

    return [
      {
        id,
        title,
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl,
        publishedAt,
      },
    ];
  });

  if (videos.length === 0) {
    throw new Error('YouTube Data API returned no videos');
  }

  return videos.slice(0, limit);
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
