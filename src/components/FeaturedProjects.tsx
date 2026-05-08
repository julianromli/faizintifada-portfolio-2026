import { ArrowRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { projects, Project } from '../data/projects';
import React from 'react';

import { motion } from 'motion/react';

interface ProjectCardProps extends Project {
  key?: React.Key;
  index: number;
}

function ProjectCard({ slug, title, description, image, tags, bgClass, imagePosition = 'object-top', index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
    >
      <Link to={`/project/${slug}`} className="block cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out">
        <div className={`overflow-hidden ${bgClass} aspect-[4/3] rounded-[1rem] relative mb-4`}>
          <img 
            src={image} 
            alt={title} 
            className={`w-full h-full object-cover ${imagePosition}`} 
          />
        </div>
        <div className="flex flex-col space-y-0.5 px-1 mt-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <span className="text-[14px] font-medium text-gray-500">{tags.join(', ')}</span>
        </div>
      </Link>
    </motion.div>
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
        {projects.map((project, index) => (
          <ProjectCard 
            key={project.slug}
            index={index}
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
