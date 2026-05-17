import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatCircleText, Globe, FigmaLogo, PenNib, Code } from '@phosphor-icons/react';
import { apiUrl } from '../lib/api';
import {
  DEFAULT_PAGE_SETTINGS,
  type PageSettings,
} from '../lib/page-settings';
import { HeroImage } from './HeroImage';

const TESTIMONIALS = [
  {
    quote: "Faiz is an exceptional designer with a keen eye for detail and user experience. His work is creative, functional, and always top-notch. Highly recommended!",
    name: "Alya",
    role: "Co Founder of Sprrint",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=5"
  },
  {
    quote: "Working with Faiz was a game-changer for our app. He perfectly captured our brand identity and delivered something beyond our wildest expectations.",
    name: "Marcus Chen",
    role: "CEO of Nova Tech",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=8"
  },
  {
    quote: "Brilliant execution and communication. The final UI was pixel-perfect and dev-ready. Will definitely collaborate again on future projects.",
    name: "Elena Rodriguez",
    role: "Engineering Manager",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=12"
  },
  {
    quote: "A true artist wrapped in a developer's mindset. Faiz gets both the aesthetic nuance and the technical implementation right every single time.",
    name: "James Doe",
    role: "Lead Product Designer",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=4"
  }
];

export function Hero() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [pageSettings, setPageSettings] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(apiUrl('/api/page-settings'));
        if (!res.ok) {
          if (!cancelled) {
            setPageSettings(DEFAULT_PAGE_SETTINGS);
          }
          return;
        }
        const settings = (await res.json()) as PageSettings;
        if (!cancelled) {
          setPageSettings(settings);
        }
      } catch {
        if (!cancelled) {
          setPageSettings(DEFAULT_PAGE_SETTINGS);
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
      <div className="flex flex-col space-y-10">
        {/* Header / Intro */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4 animate-blur-reveal">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-50/50 border-4 border-white overflow-hidden flex items-center justify-center shadow-[0px_6px_12px_rgba(0,0,0,0.25),0px_2px_4px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-out hover:scale-110 hover:-rotate-12 cursor-pointer relative">
              <HeroImage
                src={pageSettings.avatarImage}
                fallbackSrc={DEFAULT_PAGE_SETTINGS.avatarImage}
                alt="Faiz Avatar"
                imgClassName="absolute inset-0 w-full h-full object-cover rounded-1xl"
                placeholderClassName="bg-orange-100/70 blur-xl scale-110"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">Faiz Intifada</h1>
          </div>
          
          <h2 className="text-[1.75rem] sm:text-4xl leading-[1.3] text-gray-800 tracking-tight font-medium animate-blur-reveal delay-100">
            {`I Design and... Developer, Creator, Artist, and Gamer. Part of `}
            <span className="text-gray-400 inline-flex items-center">
              Cursor <img src="https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJ8y11lI5HNL9CO2WPxU8zlIhd0i7GsmceFJDy" className="w-8 h-8 mx-2 inline-block opacity-80" alt="Cursor" /> Ambassadors
            </span>
          </h2>
          
          <div className="pt-2 animate-blur-reveal delay-150">
            <button className="inline-flex items-center space-x-2 text-white px-6 py-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 btn-embossed">
              <ChatCircleText size={20} weight="regular" />
              <span>Discuss a Project</span>
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 animate-blur-reveal delay-200">
          <div className="flex items-center space-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <Globe size={18} className="text-gray-500" />
            <span>Web Design</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <FigmaLogo size={18} className="text-gray-500" />
            <span>Figma</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <ChatCircleText size={18} className="text-gray-500" />
            <span>Copywriting</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <PenNib size={18} className="text-gray-500" />
            <span>Graphic Design</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-default">
            <Code size={18} className="text-gray-500" />
            <span>Front end</span>
          </div>
        </div>

        {/* Testimonial */}
        <div className="pt-6 w-full sm:max-w-xl animate-blur-reveal delay-250">
          <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.02)] relative min-h-[260px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(2px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const }}
                className="flex-1 flex flex-col"
              >
                <p className="text-[17px] leading-relaxed text-gray-700 font-medium pb-4">
                  "{TESTIMONIALS[activeTestimonial].quote}"
                </p>
                <div className="mt-auto pt-4 flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center p-1 border border-gray-100 shrink-0">
                    <img src={TESTIMONIALS[activeTestimonial].avatar} alt={`${TESTIMONIALS[activeTestimonial].name} Avatar`} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-gray-900">{TESTIMONIALS[activeTestimonial].name}</h4>
                    <p className="text-[13px] text-gray-400 font-medium mt-0.5">{TESTIMONIALS[activeTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-out ${activeTestimonial === idx ? 'w-6 bg-gray-900' : 'w-2 bg-gray-200 hover:bg-gray-400'}`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Right Column (Images) */}
      <div className="flex flex-col gap-6 h-full mt-8 xl:mt-0 xl:-my-4">
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-gray-100 animate-blur-reveal delay-300">
          <HeroImage
            src={pageSettings.heroImageTop}
            fallbackSrc={DEFAULT_PAGE_SETTINGS.heroImageTop}
            alt="Abstract White"
            imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
            placeholderClassName="bg-gray-100 blur-xl scale-110"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-indigo-50 animate-blur-reveal delay-400">
          <HeroImage
            src={pageSettings.heroImageMiddle}
            fallbackSrc={DEFAULT_PAGE_SETTINGS.heroImageMiddle}
            alt="Abstract Colors"
            imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
            placeholderClassName="bg-indigo-50 blur-xl scale-110"
          />
        </div>
        <div className="rounded-[1rem] overflow-hidden aspect-[1.91/1] xl:aspect-auto xl:flex-1 relative bg-blue-50 animate-blur-reveal delay-500">
          <HeroImage
            src={pageSettings.heroImageBottom}
            fallbackSrc={DEFAULT_PAGE_SETTINGS.heroImageBottom}
            alt="Abstract Blue"
            imgClassName="absolute inset-0 w-full h-full object-cover object-center transform hover:scale-[1.025]"
            placeholderClassName="bg-blue-50 blur-xl scale-110"
          />
        </div>
      </div>

    </section>
  );
}
