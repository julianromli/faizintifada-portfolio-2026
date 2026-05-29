import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard, ProjectsGridSkeleton } from './ProjectCard';

export function FeaturedProjects() {
  const { projects, loading, error, retry } = useProjects({ featuredOnly: true });

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Featured Projects</h2>
        </div>
        <Link
          to="/projects"
          className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition group"
        >
          <span>View all</span>
          <ArrowRight size={16} className="text-muted group-hover:text-foreground theme-transition" />
        </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            />
          ))}
        </div>
      )}
    </section>
  );
}
