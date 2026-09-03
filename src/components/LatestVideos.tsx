import { ArrowRight } from '@phosphor-icons/react';
import { m } from 'motion/react';
import type { YouTubeVideo } from '../types/youtube';
import { useYouTubeVideos } from '../hooks/useYouTubeVideos';
import { EASE_OUT } from '../lib/motion';
import { Skeleton } from './Skeleton';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@faizintifada';
const DEFAULT_VIDEO_LIMIT = 3;
const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

interface VideoCardProps {
  video: YouTubeVideo;
  index: number;
}

function VideoCard({ video, index }: VideoCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.1 }}
    >
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out"
      >
        <div className="overflow-hidden bg-surface-nested aspect-[4/3] rounded-[1rem] relative mb-4 transition-shadow duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-elevated">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.035]"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-black/[0.03]" />
        </div>
        <div className="flex flex-col gap-y-0.5 px-1 mt-1">
          <h3 className="text-base font-semibold text-foreground transition-colors duration-200 ease-out group-hover:text-muted">
            {video.title}
          </h3>
          <span className="text-[14px] font-medium text-muted">{formatPublishedDate(video.publishedAt)}</span>
        </div>
      </a>
    </m.div>
  );
}

/** Reserves the section's real height while the videos load, so nothing below shifts. */
function LatestVideosSkeleton() {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Latest Videos</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: DEFAULT_VIDEO_LIMIT }, (_, k) => (
          <div key={k}>
            <Skeleton
              className="aspect-[4/3] rounded-[1rem] mb-4"
              style={{ animationDelay: `${k * 80}ms` }}
            />
            <div className="flex flex-col gap-y-2 px-1 mt-1">
              <Skeleton variant="text" className="w-3/4" style={{ animationDelay: `${k * 80}ms` }} />
              <Skeleton
                variant="text"
                muted
                className="h-3 w-1/3"
                style={{ animationDelay: `${k * 80}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LatestVideos() {
  const { videos, loading, error } = useYouTubeVideos({ limit: DEFAULT_VIDEO_LIMIT });

  if (loading) {
    return <LatestVideosSkeleton />;
  }

  if (error || videos.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Latest Videos</h2>
        </div>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition group"
        >
          <span>View YouTube</span>
          <ArrowRight size={16} className="text-muted group-hover:text-foreground theme-transition" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </section>
  );
}

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}
