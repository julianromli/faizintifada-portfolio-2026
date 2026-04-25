import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { projects, Project } from '../data/projects';
import React from 'react';

interface ProjectCardProps extends Project {
  key?: React.Key;
}

function ProjectCard({ slug, title, description, image, tags, bgClass, imagePosition = 'object-top' }: ProjectCardProps) {
  return (
    <Link to={`/project/${slug}`} className="group block cursor-pointer rounded-[2rem] border border-gray-100 bg-white overflow-hidden hover:shadow-sm transition-shadow duration-300">
      <div className={`overflow-hidden ${bgClass} aspect-[4/3] relative`}>
        <img 
          src={image} 
          alt={title} 
          className={`w-full h-full object-cover ${imagePosition} opacity-90 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] mix-blend-multiply group-hover:scale-105`} 
        />
      </div>
      <div className="p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-[20px] font-medium text-gray-900 mb-1.5">{title}</h3>
          <p className="text-[15.5px] text-gray-500 font-normal leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {tags.map(tag => (
            <span key={tag} className="px-4 py-1.5 rounded-full border border-gray-100 text-[13px] font-medium text-gray-600 bg-white">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function FeaturedProjects() {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 space-y-4 sm:space-y-0">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3">SELECTED WORK</p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Featured Projects</h2>
        </div>
        <Link to="/projects" className="flex items-center space-x-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors group">
          <span>View all projects</span>
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
