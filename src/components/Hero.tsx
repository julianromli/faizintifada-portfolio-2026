import { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { BracketsCurly, ChatCircleText, Code, DownloadSimple, FigmaLogo, PenNib, Sparkle } from '@phosphor-icons/react';
import { apiUrl } from '../lib/api';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../lib/page-settings';
import type { Testimonial } from '../types/testimonial';
import { HeroImage } from './HeroImage';
import { useContactDialog } from './ContactDialogProvider';
import { CursorIcon } from './CursorIcon';

export function Hero() {
  const { openContactDialog } = useContactDialog();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  // Hero image srcs start empty so only the shimmer shows until settings arrive —
  // initializing with DEFAULT_PAGE_SETTINGS would flash the default images first.
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    ...DEFAULT_PAGE_SETTINGS,
    heroImageTop: '',
    heroImageMiddle: '',
    heroImageBottom: '',
  });

  const count = testimonials.length;
  const activeIndex = count === 0 ? 0 : Math.min(activeTestimonial, count - 1);
  const current = count > 0 ? testimonials[activeIndex] : null;

  const shouldReduceMotion = useReducedMotion();

  // Skills pills temporarily hidden — flip to true to restore.
  const showSkills = false;

  useEffect(() => {
    if (count <= 1 || shouldReduceMotion) return;

    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % count);
    }, 5000);

    return () => clearInterval(interval);
  }, [count, shouldReduceMotion]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [settingsRes, testimonialsRes] = await Promise.all([
          fetch(apiUrl('/api/page-settings')),
          fetch(apiUrl('/api/testimonials')),
        ]);

        if (cancelled) return;

        if (settingsRes.ok) {
          const settings = (await settingsRes.json()) as PageSettings;
          setPageSettings(settings);
        } else {
          setPageSettings(DEFAULT_PAGE_SETTINGS);
        }

        if (testimonialsRes.ok) {
          const items = (await testimonialsRes.json()) as Testimonial[];
          setTestimonials(items);
        } else {
          setTestimonials([]);
        }
      } catch {
        if (!cancelled) {
          setPageSettings(DEFAULT_PAGE_SETTINGS);
          setTestimonials([]);
        }
      } finally {
        if (!cancelled) {
          setTestimonialsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-12 xl:gap-6 items-start">
      {/* Left Column — intro + skills (mobile: 1st; desktop: col 1 top) */}
      <div className="order-1 xl:order-none xl:col-start-1 xl:row-start-1 flex flex-col gap-y-10 xl:mb-14">
        {/* Header / Intro */}
        <div className="space-y-6">
          <div className="flex items-center gap-x-4 animate-blur-reveal">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border-4 border-card overflow-hidden flex items-center justify-center shadow-[0px_6px_12px_rgba(0,0,0,0.25),0px_2px_4px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-out hover:scale-110 hover:-rotate-12 cursor-pointer relative">
              <HeroImage
                key={pageSettings.avatarImage}
                src={pageSettings.avatarImage}
                alt="Faiz Avatar"
                imgClassName="absolute inset-0 w-full h-full object-cover rounded-1xl"
                loading="eager"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">Faiz Intifada</h1>
          </div>
          
          <h2 className="text-[1.75rem] sm:text-4xl leading-[1.3] text-foreground tracking-tight font-medium animate-blur-reveal delay-100">
            {`Design Engineer who ships products, not just mockups. Part of `}
            <span className="text-muted inline-flex items-center">
              Cursor <CursorIcon className="size-8 mx-2 inline-block shrink-0 text-foreground opacity-80" /> Ambassador
            </span>
          </h2>
          
          <div className="pt-2 animate-blur-reveal delay-150 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openContactDialog}
              className="inline-flex items-center gap-x-2 text-white px-6 py-4 rounded-full font-medium btn-embossed"
            >
              <ChatCircleText size={20} weight="regular" />
              <span>Discuss a Project</span>
            </button>
            <a
              href="/faiz-intifada-cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-x-2 px-6 py-4 rounded-full font-medium border border-border text-foreground hover:bg-surface active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <DownloadSimple size={20} weight="regular" />
              <span>Download CV</span>
            </a>
          </div>
        </div>

        {/* Skills — restyled (medium, 44px consistent height); hidden for now */}
        {showSkills && (
          <div className="flex flex-wrap gap-3 pt-4 animate-blur-reveal delay-200">
            <div className="flex min-h-11 items-center gap-x-2.5 px-5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
              <PenNib size={18} className="text-muted" />
              <span>Product Design</span>
            </div>
            <div className="flex min-h-11 items-center gap-x-2.5 px-5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
              <Code size={18} className="text-muted" />
              <span>UI Engineering</span>
            </div>
            <div className="flex min-h-11 items-center gap-x-2.5 px-5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
              <BracketsCurly size={18} className="text-muted" />
              <span>React / Next.js</span>
            </div>
            <div className="flex min-h-11 items-center gap-x-2.5 px-5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
              <FigmaLogo size={18} className="text-muted" />
              <span>Design Systems</span>
            </div>
            <div className="flex min-h-11 items-center gap-x-2.5 px-5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
              <Sparkle size={18} className="text-muted" />
              <span>Prototyping</span>
            </div>
          </div>
        )}
      </div>

      {/* Hero images (mobile: 2nd; desktop: col 2) — each in its own grid row so image 2 aligns with the testimonial */}
      <div className="order-2 aspect-[4/3] xl:order-none xl:col-start-2 xl:row-start-1">
        <HeroImage
          key={pageSettings.heroImageTop}
          src={pageSettings.heroImageTop}
          alt="Faiz Intifada — design engineer portfolio hero"
          className="h-full rounded-[1rem] animate-blur-reveal delay-300"
          imgClassName="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          fill
        />
      </div>
      <div className="order-2 aspect-[4/3] xl:order-none xl:col-start-2 xl:row-start-2">
        <HeroImage
          key={pageSettings.heroImageMiddle}
          src={pageSettings.heroImageMiddle}
          alt="Design engineer work — UI and product visuals"
          className="h-full rounded-[1rem] animate-blur-reveal delay-400"
          imgClassName="absolute inset-0 w-full h-full object-cover object-center"
          fill
        />
      </div>

      {/* Testimonial (mobile: 3rd; desktop: col 1 bottom) — minimal cross-fade */}
      {!testimonialsLoading && count > 0 && current ? (
        <div className="order-3 xl:order-none xl:col-start-1 xl:row-start-2 pt-0 w-full sm:max-w-xl animate-blur-reveal delay-250">
          {/* Quote — grid-stacked: row auto-sizes to the tallest quote (consistent height, no overlap) */}
          <div className="mb-6 grid">
            {testimonials.map((t, i) => (
              <p
                key={t.id}
                aria-hidden={activeIndex !== i}
                className={`col-start-1 row-start-1 text-pretty text-xl md:text-2xl font-medium leading-relaxed text-foreground transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${
                  activeIndex === i
                    ? shouldReduceMotion
                      ? 'opacity-100'
                      : 'opacity-100 translate-y-0 blur-0'
                    : shouldReduceMotion
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-0 translate-y-4 blur-sm pointer-events-none'
                }`}
              >
                {`“${t.quote}”`}
              </p>
            ))}
          </div>

          {/* Author row — overlapping avatar buttons + active author info */}
          <div className="flex items-center gap-x-5">
            <div className="flex -space-x-2">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Show testimonial from ${t.name}`}
                  aria-pressed={activeIndex === i}
                  className={`relative size-10 touch-manipulation overflow-hidden rounded-full ring-2 ring-shell transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-shell ${
                    activeIndex === i ? 'z-10 scale-110' : 'grayscale hover:grayscale-0 hover:scale-105'
                  }`}
                >
                  <img src={t.avatar} alt={`${t.name} avatar`} className="absolute inset-0 size-full object-cover" />
                </button>
              ))}
            </div>

            <div aria-hidden="true" className="h-8 w-px bg-border" />

            <div className="grid min-h-[44px] flex-1">
              {testimonials.map((t, i) => (
                <div
                  key={t.id}
                  aria-hidden={activeIndex !== i}
                  className={`col-start-1 row-start-1 flex flex-col justify-center transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                    activeIndex === i
                      ? shouldReduceMotion
                        ? 'opacity-100'
                        : 'opacity-100 translate-x-0'
                      : shouldReduceMotion
                        ? 'opacity-0 pointer-events-none'
                        : 'opacity-0 -translate-x-2 pointer-events-none'
                  }`}
                >
                  <span className="text-balance text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs text-muted">{t.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}
