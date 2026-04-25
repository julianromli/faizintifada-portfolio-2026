import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react';
import { projects } from '../data/projects';
import { useEffect } from 'react';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Project not found</h1>
        <Link 
          to="/"
          className="flex items-center space-x-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>
      </div>
    );
  }

  return (
    <main className="animate-fade-in">
      {/* Back Link */}
      <div className="mb-12">
        <Link 
          to="/"
          className="inline-flex items-center space-x-2 text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to projects</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">
        <div className="lg:col-span-5 space-y-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 mb-6 leading-tight">
              {project.title}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {project.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 rounded-full border border-gray-100 text-[13px] font-medium text-gray-600 bg-gray-50">
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
            {project.client && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-2">Client</p>
                <p className="text-[15px] font-medium text-gray-900">{project.client}</p>
              </div>
            )}
            {project.role && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-2">Role</p>
                <p className="text-[15px] font-medium text-gray-900">{project.role}</p>
              </div>
            )}
            {project.timeline && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-2">Timeline</p>
                <p className="text-[15px] font-medium text-gray-900">{project.timeline}</p>
              </div>
            )}
          </div>

          {project.liveUrl && (
            <div className="pt-4">
              <a 
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-full text-[14px] font-medium hover:bg-gray-800 transition-colors group"
              >
                <span>Visit Live Site</span>
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className={`rounded-[2rem] overflow-hidden ${project.bgClass} aspect-[4/3] sm:aspect-video relative border border-gray-100`}>
            <img 
              src={project.image} 
              alt={project.title} 
              className={`w-full h-full object-cover ${project.imagePosition || 'object-center'} mix-blend-multiply opacity-95`}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto mb-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">About the Project</h2>
        <div className="text-lg text-gray-500 space-y-6">
          <p className="leading-relaxed">{project.longDescription}</p>
        </div>
      </div>

      {/* Image Gallery */}
      {project.images && project.images.length > 1 && (
        <div className="space-y-8">
          {project.images.slice(1).map((img, index) => (
            <div key={index} className="rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100">
              <img 
                src={img} 
                alt={`${project.title} screenshot ${index + 1}`} 
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
