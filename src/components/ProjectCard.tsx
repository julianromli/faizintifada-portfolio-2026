import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { resolveProjectBgClass } from '../lib/project-bg-presets';
import { Skeleton } from './Skeleton';
import { EASE_OUT } from '../lib/motion';

export interface ProjectCardProps {
  slug: string;
  title: string;
  image: string;
  tags: string[];
  bgClass: string;
  imagePosition?: string;
  index: number;
  variant?: 'grid' | 'list';
}

export function ProjectCard({
  slug,
  title,
  image,
  tags,
  bgClass,
  imagePosition = 'object-top',
  index,
  variant = 'grid',
}: ProjectCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.04 }}
    >
      <Link
        to={`/project/${slug}`}
        className="t-learn group cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out"
      >
        {variant === 'list' ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <div
              className={`shrink-0 w-28 h-20 sm:w-44 sm:h-28 overflow-hidden ${resolveProjectBgClass(bgClass)} rounded-[0.75rem] relative transition-shadow duration-300 ease-[var(--ease-smooth-out)] group-hover:shadow-elevated theme-transition`}
            >
              <img
                src={image}
                alt={title}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover ${imagePosition} transition-transform duration-300 ease-[var(--ease-smooth-out)] group-hover:scale-[1.035]`}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground transition-colors duration-200 ease-out group-hover:text-muted truncate">
                {title}
              </h3>
              <span className="text-[14px] font-medium text-muted truncate">{tags.join(', ')}</span>
            </div>
            <span className="t-learn-chevron shrink-0 text-muted group-hover:text-foreground">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="none" aria-hidden="true">
                <path className="t-learn-arm t-learn-arm-top" d="M6 4L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path className="t-learn-arm t-learn-arm-bot" d="M10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        ) : (
          <>
            <div
              className={`overflow-hidden ${resolveProjectBgClass(bgClass)} aspect-[4/3] rounded-[1rem] relative mb-4 transition-shadow duration-300 ease-[var(--ease-smooth-out)] group-hover:shadow-elevated theme-transition`}
            >
              <img
                src={image}
                alt={title}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover ${imagePosition} transition-transform duration-300 ease-[var(--ease-smooth-out)] group-hover:scale-[1.035]`}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 ease-[var(--ease-smooth-out)] group-hover:bg-black/[0.03]" />
            </div>
            <div className="flex flex-col gap-y-0.5 px-1 mt-1">
              <h3 className="text-base font-semibold text-foreground transition-colors duration-200 ease-out group-hover:text-muted">
                {title}
              </h3>
              <span className="text-[14px] font-medium text-muted">{tags.join(', ')}</span>
            </div>
          </>
        )}
      </Link>
    </m.div>
  );
}

export function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[0, 1, 2].map((k) => (
        <div key={k} className="space-y-4">
          <Skeleton
            className="aspect-[4/3] rounded-[1rem]"
            style={{ animationDelay: `${k * 80}ms` }}
          />
          <div className="space-y-2 px-1">
            <Skeleton variant="text" className="w-2/3" style={{ animationDelay: `${k * 80}ms` }} />
            <Skeleton variant="text" muted className="h-3 w-full" style={{ animationDelay: `${k * 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
