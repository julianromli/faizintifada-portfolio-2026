import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type { YouTubeVideo } from '../types/youtube';
import { useYouTubeVideos } from '../hooks/useYouTubeVideos';

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
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as const, delay: index * 0.1 }}
    >
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out"
      >
        <div className="overflow-hidden bg-gray-100 aspect-[4/3] rounded-[1rem] relative mb-4">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col space-y-0.5 px-1 mt-1">
          <h3 className="text-base font-semibold text-gray-900">{video.title}</h3>
          <span className="text-[14px] font-medium text-gray-500">{formatPublishedDate(video.publishedAt)}</span>
        </div>
      </a>
    </motion.div>
  );
}

export function LatestVideos() {
  const { videos, loading, error } = useYouTubeVideos({ limit: DEFAULT_VIDEO_LIMIT });

  if (loading || error || videos.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Latest Videos</h2>
        </div>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <span>View YouTube</span>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
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
