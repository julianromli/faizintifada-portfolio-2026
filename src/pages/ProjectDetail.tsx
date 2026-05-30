import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { m } from 'motion/react';
import { useProject } from '../hooks/useProject';
import { resolveProjectBgClass } from '../lib/project-bg-presets';
import { Seo } from '../components/Seo';
import { Skeleton } from '../components/Skeleton';
import { creativeWorkSchema } from '../lib/seo';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
};

function DetailSkeleton() {
  return (
    <div className="pb-24 space-y-12">
      <Skeleton className="mb-12 h-4 w-32 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-12 rounded-lg w-full" />
          <Skeleton variant="text" muted className="w-full" />
          <Skeleton variant="text" muted className="w-4/5" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="aspect-[4/3] sm:aspect-video rounded-[2rem]" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton variant="text" muted className="w-full" />
        <Skeleton variant="text" muted className="w-full" />
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { project, loading, error, retry } = useProject(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading && slug) {
    return <DetailSkeleton />;
  }

  if (error && slug) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-y-6 pb-24">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-[15px] text-muted">{error.message}</p>
        <button
          type="button"
          onClick={() => retry()}
          className="text-[15px] font-semibold text-foreground underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <>
        <Seo title="Project not found" noIndex path={`/project/${slug ?? ''}`} />
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
        <Link
          to="/"
          className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition"
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>
      </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title={`${project.title} — Design Engineer Case Study`}
        description={project.description}
        path={`/project/${project.slug}`}
        image={project.image}
        type="article"
        jsonLd={creativeWorkSchema(project)}
      />
      <m.main
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="pb-24"
    >
      <m.div variants={itemVariants} className="mb-12">
        <Link
          to="/projects"
          className="inline-flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground active:scale-95 theme-transition group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform duration-200 ease-out"
          />
          <span>Back to projects</span>
        </Link>
      </m.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">
        <div className="lg:col-span-5 space-y-8">
          <m.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
              {project.title}
            </h1>
            <p className="text-lg text-muted leading-relaxed">{project.description}</p>
          </m.div>

          <m.div variants={itemVariants} className="flex flex-wrap gap-2.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full border border-border text-[13px] font-medium text-muted bg-surface"
              >
                {tag}
              </span>
            ))}
          </m.div>

          <m.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-8 pt-8 border-t border-border"
          >
            {project.client && (
              <div>
                <p className="text-[11px] font-semibold text-muted tracking-wider uppercase mb-2">
                  Client
                </p>
                <p className="text-[15px] font-medium text-foreground">{project.client}</p>
              </div>
            )}
            {project.role && (
              <div>
                <p className="text-[11px] font-semibold text-muted tracking-wider uppercase mb-2">
                  Role
                </p>
                <p className="text-[15px] font-medium text-foreground">{project.role}</p>
              </div>
            )}
            {project.timeline && (
              <div>
                <p className="text-[11px] font-semibold text-muted tracking-wider uppercase mb-2">
                  Timeline
                </p>
                <p className="text-[15px] font-medium text-foreground">{project.timeline}</p>
              </div>
            )}
          </m.div>

          {project.liveUrl && (
            <m.div variants={itemVariants} className="pt-4">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-x-2 px-6 py-3 bg-foreground text-canvas rounded-full text-[14px] font-medium hover:bg-foreground/90 active:scale-95 theme-transition group"
              >
                <span>Visit Live Site</span>
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 ease-out"
                />
              </a>
            </m.div>
          )}
        </div>

        <m.div variants={itemVariants} className="lg:col-span-7">
          <div
            className={`rounded-[2rem] overflow-hidden ${resolveProjectBgClass(project.bgClass)} aspect-[4/3] sm:aspect-video relative border border-border theme-transition`}
          >
            <img
              src={project.image}
              alt={project.title}
              className={`w-full h-full object-cover ${project.imagePosition || 'object-center'}`}
            />
          </div>
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as const }}
        className="max-w-3xl mx-auto mb-24"
      >
        <h2 className="text-2xl font-semibold text-foreground mb-6">About the Project</h2>
        <div className="text-lg text-muted space-y-6">
          {project.longDescription
            .split(/\n\n+/)
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
        </div>
      </m.div>

      {project.images && project.images.length > 1 && (
        <div className="space-y-8">
          {project.images.slice(1).map((img) => (
            <m.div
              key={img}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as const }}
              className="rounded-[2rem] overflow-hidden bg-surface border border-border"
            >
              <img
                src={img}
                alt={`${project.title} screenshot`}
                className="w-full h-auto object-cover"
              />
            </m.div>
          ))}
        </div>
      )}
    </m.main>
    </>
  );
}
