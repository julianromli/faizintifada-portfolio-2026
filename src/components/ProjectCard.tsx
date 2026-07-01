import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { resolveProjectBgClass } from '../lib/project-bg-presets';
import { Skeleton } from './Skeleton';

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
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as const, delay: index * 0.1 }}
    >
      <Link
        to={`/project/${slug}`}
        className="group cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out"
      >
        {variant === 'list' ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <div
              className={`shrink-0 w-28 h-20 sm:w-44 sm:h-28 overflow-hidden ${resolveProjectBgClass(bgClass)} rounded-[0.75rem] relative transition-shadow duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-elevated theme-transition`}
            >
              <img
                src={image}
                alt={title}
                className={`w-full h-full object-cover ${imagePosition} transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.035]`}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground transition-colors duration-200 ease-out group-hover:text-muted truncate">
                {title}
              </h3>
              <span className="text-[14px] font-medium text-muted truncate">{tags.join(', ')}</span>
            </div>
            <ArrowRight
              size={20}
              className="shrink-0 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200 ease-out"
            />
          </div>
        ) : (
          <>
            <div
              className={`overflow-hidden ${resolveProjectBgClass(bgClass)} aspect-[4/3] rounded-[1rem] relative mb-4 transition-shadow duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-elevated theme-transition`}
            >
              <img
                src={image}
                alt={title}
                className={`w-full h-full object-cover ${imagePosition} transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.035]`}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-black/[0.03]" />
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
