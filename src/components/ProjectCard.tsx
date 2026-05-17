import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export interface ProjectCardProps {
  slug: string;
  title: string;
  image: string;
  tags: string[];
  bgClass: string;
  imagePosition?: string;
  index: number;
}

export function ProjectCard({
  slug,
  title,
  image,
  tags,
  bgClass,
  imagePosition = 'object-top',
  index,
}: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as const, delay: index * 0.1 }}
    >
      <Link
        to={`/project/${slug}`}
        className="group block cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out"
      >
        <div
          className={`overflow-hidden ${bgClass} aspect-[4/3] rounded-[1rem] relative mb-4 transition-shadow duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]`}
        >
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover ${imagePosition} transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.035]`}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-black/[0.03]" />
        </div>
        <div className="flex flex-col space-y-0.5 px-1 mt-1">
          <h3 className="text-base font-semibold text-gray-900 transition-colors duration-200 ease-out group-hover:text-gray-700">
            {title}
          </h3>
          <span className="text-[14px] font-medium text-gray-500">{tags.join(', ')}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[0, 1, 2].map((k) => (
        <div key={k} className="animate-pulse space-y-4">
          <div className="aspect-[4/3] rounded-[1rem] bg-gray-100" />
          <div className="space-y-2 px-1">
            <div className="h-4 rounded bg-gray-100 w-2/3" />
            <div className="h-3 rounded bg-gray-50 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
