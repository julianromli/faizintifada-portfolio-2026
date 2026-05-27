import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard, ProjectsGridSkeleton } from '../components/ProjectCard';
import { Seo } from '../components/Seo';

export function Projects() {
  const { projects, loading, error, retry } = useProjects();

  return (
    <>
      <Seo
        title="Design Projects"
        description="Explore design engineer case studies and selected project work by Faiz Intifada."
        path="/projects"
      />
      <main className="space-y-10 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-[15px] font-medium text-gray-500 hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out group mb-4"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform duration-200 ease-out"
            />
            <span>Back to home</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">All projects</h1>
          <p className="text-[15px] text-gray-500 mt-2">Every case study in the archive.</p>
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
        <p className="text-[15px] text-gray-500">No projects yet.</p>
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
    </main>
    </>
  );
}
