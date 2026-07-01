import { useState } from 'react';
import { ArrowRight, List, SquaresFour } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard, ProjectsGridSkeleton } from './ProjectCard';

type ViewMode = 'grid' | 'list';

export function FeaturedProjects() {
  const { projects, loading, error, retry } = useProjects({ featuredOnly: true });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const toggle = (mode: ViewMode) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-label={`${mode} view`}
      aria-pressed={viewMode === mode}
      className={`flex items-center justify-center size-9 rounded-full transition-colors duration-200 ease-out ${
        viewMode === mode
          ? 'bg-surface text-foreground'
          : 'text-muted hover:text-foreground'
      }`}
    >
      {mode === 'grid' ? <SquaresFour size={18} /> : <List size={18} />}
    </button>
  );

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Featured Projects</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-full border border-border">
            {toggle('grid')}
            {toggle('list')}
          </div>
          <Link
            to="/projects"
            className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition group"
          >
            <span>View all</span>
            <ArrowRight size={16} className="text-muted group-hover:text-foreground theme-transition" />
          </Link>
        </div>
      </div>

      {loading && <ProjectsGridSkeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4 text-[15px] text-red-800">
          <p className="font-medium">Could not load projects.</p>
          <p className="text-red-700/90 mt-1">{error.message}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-3 text-[14px] font-semibold underline decoration-red-800/40 hover:decoration-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <p className="text-[15px] text-muted">No featured projects yet.</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div
          className={
            viewMode === 'list'
              ? 'flex flex-col gap-6'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
          }
        >
          {projects.map((project, index) => (
            <ProjectCard
              key={project.slug}
              index={index}
              slug={project.slug}
              title={project.title}
              image={project.image}
              tags={project.tags}
              bgClass={project.bgClass}
              imagePosition={project.imagePosition}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}
