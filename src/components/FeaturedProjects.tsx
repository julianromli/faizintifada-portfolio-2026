import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { projects, Project } from '../data/projects';
import React from 'react';

interface ProjectCardProps extends Project {
  key?: React.Key;
}

function ProjectCard({ slug, title, description, image, tags, bgClass, imagePosition = 'object-top' }: ProjectCardProps) {
  return (
    <Link to={`/project/${slug}`} className="block cursor-pointer">
      <div className={`overflow-hidden ${bgClass} aspect-[1.91/1] rounded-[1rem] relative mb-4`}>
        <img 
          src={image} 
          alt={title} 
          className={`w-full h-full object-cover ${imagePosition}`} 
        />
      </div>
      <div className="flex justify-between items-start px-1">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-base font-normal text-gray-500 text-right">{tags.join(', ')}</span>
      </div>
    </Link>
  );
}

export function FeaturedProjects() {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Featured Projects</h2>
        </div>
        <Link to="/projects" className="flex items-center space-x-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors group">
          <span>View all</span>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard 
            key={project.slug}
            slug={project.slug}
            title={project.title}
            description={project.description}
            longDescription={project.longDescription}
            image={project.image}
            tags={project.tags}
            bgClass={project.bgClass}
            imagePosition={project.imagePosition}
          />
        ))}
      </div>
    </section>
  );
}
