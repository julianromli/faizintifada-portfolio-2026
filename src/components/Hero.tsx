import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ChatCircleText, Globe, FigmaLogo, PenNib, Code } from '@phosphor-icons/react';
import { apiUrl } from '../lib/api';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../lib/page-settings';
import type { Testimonial } from '../types/testimonial';
import { HeroImage, HeroImageSkeleton } from './HeroImage';
import { CONTACT_MAILTO } from '../constants';

export function Hero() {
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
      {/* Left Column (Info) */}
      <div className="flex flex-col gap-y-10">
        {/* Header / Intro */}
        <div className="space-y-6">
          <div className="flex items-center gap-x-4 animate-blur-reveal">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50/50 border-4 border-white overflow-hidden flex items-center justify-center shadow-[0px_6px_12px_rgba(0,0,0,0.25),0px_2px_4px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-out hover:scale-110 hover:-rotate-12 cursor-pointer relative">
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
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">Faiz Intifada</h1>
          </div>
          
          <h2 className="text-[1.75rem] sm:text-4xl leading-[1.3] text-gray-800 tracking-tight font-medium animate-blur-reveal delay-100">
            {`Design engineer building products at the intersection of UI, code, and craft. Part of `}
            <span className="text-gray-400 inline-flex items-center">
              Cursor <img src="https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJ8y11lI5HNL9CO2WPxU8zlIhd0i7GsmceFJDy" className="size-8 mx-2 inline-block opacity-80" alt="Cursor" /> Ambassadors
            </span>
          </h2>
          
          <div className="pt-2 animate-blur-reveal delay-150">
            <a
              href={CONTACT_MAILTO}
              className="inline-flex items-center gap-x-2 text-white px-6 py-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 btn-embossed"
            >
              <ChatCircleText size={20} weight="regular" />
              <span>Discuss a Project</span>
            </a>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 animate-blur-reveal delay-200">
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <Globe size={18} className="text-gray-500" />
            <span>Web Design</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <FigmaLogo size={18} className="text-gray-500" />
            <span>Figma</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <ChatCircleText size={18} className="text-gray-500" />
            <span>Copywriting</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <PenNib size={18} className="text-gray-500" />
            <span>Graphic Design</span>
          </div>
          <div className="flex items-center gap-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <Code size={18} className="text-gray-500" />
            <span>Front end</span>
          </div>
        </div>

        {/* Testimonial */}
        {!testimonialsLoading && count > 0 && current ? (
          <div className="pt-6 w-full sm:max-w-xl animate-blur-reveal delay-250">
            <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.02)] relative min-h-[260px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <m.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(2px)" }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-[17px] leading-relaxed text-gray-700 font-medium pb-4">
                    &ldquo;{current.quote}&rdquo;
                  </p>
                  <div className="mt-auto pt-4 flex items-center gap-x-4">
                    <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center p-1 border border-gray-100 shrink-0">
                      <img src={current.avatar} alt={`${current.name} Avatar`} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-900">{current.name}</h4>
                      <p className="text-[13px] text-gray-400 font-medium mt-0.5">{current.role}</p>
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
                    className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-out ${activeIndex === idx ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200 hover:bg-gray-400'}`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

      </div>

      {/* Right Column (Images) */}
      <div className="flex flex-col gap-6 h-full mt-8 xl:mt-0 xl:-my-4">
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-gray-100 animate-blur-reveal delay-300">
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
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-gray-100 animate-blur-reveal delay-400">
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
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-gray-100 animate-blur-reveal delay-500">
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

    </section>
  );
}
