import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { BracketsCurly, ChatCircleText, Code, FigmaLogo, PenNib, Sparkle } from '@phosphor-icons/react';
import { apiUrl } from '../lib/api';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../lib/page-settings';
import type { Testimonial } from '../types/testimonial';
import { HeroImage, HeroImageSkeleton } from './HeroImage';
import { useContactDialog } from './ContactDialogProvider';
import { CursorIcon } from './CursorIcon';

export function Hero() {
  const { openContactDialog } = useContactDialog();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const count = testimonials.length;
  const activeIndex = count === 0 ? 0 : Math.min(activeTestimonial, count - 1);
  const current = count > 0 ? testimonials[activeIndex] : null;

  useEffect(() => {
    if (count <= 1) return;

    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % count);
    }, 5000);

    return () => clearInterval(interval);
  }, [count]);

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
          setSettingsLoading(false);
          setTestimonialsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-12 xl:gap-20 items-start">
      {/* Left Column — intro + skills (mobile: 1st; desktop: col 1 top) */}
      <div className="order-1 xl:order-none xl:col-start-1 xl:row-start-1 flex flex-col gap-y-10">
        {/* Header / Intro */}
        <div className="space-y-6">
          <div className="flex items-center gap-x-4 animate-blur-reveal">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border-4 border-card overflow-hidden flex items-center justify-center shadow-[0px_6px_12px_rgba(0,0,0,0.25),0px_2px_4px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-out hover:scale-110 hover:-rotate-12 cursor-pointer relative">
              {settingsLoading || !pageSettings ? (
                <HeroImageSkeleton />
              ) : (
                <HeroImage
                  key={pageSettings.avatarImage}
                  src={pageSettings.avatarImage}
                  alt="Faiz Avatar"
                  imgClassName="absolute inset-0 w-full h-full object-cover rounded-1xl"
                  loading="eager"
                  fetchPriority="high"
                />
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">Faiz Intifada</h1>
          </div>
          
          <h2 className="text-[1.75rem] sm:text-4xl leading-[1.3] text-foreground tracking-tight font-medium animate-blur-reveal delay-100">
            {`Design engineer building products at the intersection of UI, code, and craft. Part of `}
            <span className="text-muted inline-flex items-center">
              Cursor <CursorIcon className="size-8 mx-2 inline-block shrink-0 text-foreground opacity-80" /> Ambassadors
            </span>
          </h2>
          
          <div className="pt-2 animate-blur-reveal delay-150">
            <button
              type="button"
              onClick={openContactDialog}
              className="inline-flex items-center gap-x-2 text-white px-6 py-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground focus:ring-offset-card btn-embossed"
            >
              <ChatCircleText size={20} weight="regular" />
              <span>Discuss a Project</span>
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 animate-blur-reveal delay-200">
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
            <PenNib size={18} className="text-muted" />
            <span>Product Design</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
            <Code size={18} className="text-muted" />
            <span>UI Engineering</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
            <BracketsCurly size={18} className="text-muted" />
            <span>React / Next.js</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
            <FigmaLogo size={18} className="text-muted" />
            <span>Design Systems</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface theme-transition cursor-default">
            <Sparkle size={18} className="text-muted" />
            <span>Prototyping</span>
          </div>
        </div>
      </div>

      {/* Hero images (mobile: 2nd; desktop: col 2) */}
      <div className="order-2 xl:order-none xl:col-start-2 xl:row-start-1 xl:row-span-2 flex flex-col gap-6 h-full xl:-my-4">
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-surface-nested animate-blur-reveal delay-300">
          {settingsLoading || !pageSettings ? (
            <HeroImageSkeleton />
          ) : (
            <HeroImage
              key={pageSettings.heroImageTop}
              src={pageSettings.heroImageTop}
              alt="Faiz Intifada — design engineer portfolio hero"
              imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
              loading="eager"
              fetchPriority="high"
            />
          )}
        </div>
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-surface-nested animate-blur-reveal delay-400">
          {settingsLoading || !pageSettings ? (
            <HeroImageSkeleton />
          ) : (
            <HeroImage
              key={pageSettings.heroImageMiddle}
              src={pageSettings.heroImageMiddle}
              alt="Design engineer work — UI and product visuals"
              imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
            />
          )}
        </div>
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-surface-nested animate-blur-reveal delay-500">
          {settingsLoading || !pageSettings ? (
            <HeroImageSkeleton />
          ) : (
            <HeroImage
              key={pageSettings.heroImageBottom}
              src={pageSettings.heroImageBottom}
              alt="Design engineer portfolio — digital product detail"
              imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
            />
          )}
        </div>
      </div>

      {/* Testimonial (mobile: 3rd; desktop: col 1 bottom) */}
      {!testimonialsLoading && count > 0 && current ? (
        <div className="order-3 xl:order-none xl:col-start-1 xl:row-start-2 pt-0 xl:pt-6 w-full sm:max-w-xl animate-blur-reveal delay-250">
          <div className="border border-border rounded-3xl p-8 bg-card shadow-subtle relative min-h-[260px] flex flex-col justify-between theme-transition">
            <AnimatePresence mode="wait">
              <m.div
                key={current.id}
                initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(2px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const }}
                className="flex-1 flex flex-col"
              >
                <p className="text-[17px] leading-relaxed text-foreground font-medium pb-4">
                  &ldquo;{current.quote}&rdquo;
                </p>
                <div className="mt-auto pt-4 flex items-center gap-x-4">
                  <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center p-1 border border-border shrink-0">
                    <img src={current.avatar} alt={`${current.name} Avatar`} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-foreground">{current.name}</h4>
                    <p className="text-[13px] text-muted font-medium mt-0.5">{current.role}</p>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
          {count > 1 ? (
            <div className="flex justify-center gap-x-2 mt-6">
              {testimonials.map((testimonial, idx) => (
                <button
                  key={testimonial.id}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-out ${activeIndex === idx ? 'w-6 bg-foreground' : 'w-2 bg-surface-nested hover:bg-muted'}`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

    </section>
  );
}
