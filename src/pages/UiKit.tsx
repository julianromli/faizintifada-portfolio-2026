import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Lightning,
  Package,
  Sparkle,
  Stack,
  Star,
  X,
} from '@phosphor-icons/react';
import { m } from 'motion/react';
import { Seo } from '../components/Seo';
import { CheckoutDialog } from '../components/CheckoutDialog';
import { ImageLightbox } from '../components/ImageLightbox';
import { UI_KIT } from '../constants';

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
};

/** Like fadeUp but without filter — CSS filter on a video ancestor breaks native control clicks. */
const fadeUpLite = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

function formatIDR(amount: number) {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

const SCREENSHOTS = [
  '/ui-kit/ui-kit-1.webp',
  '/ui-kit/ui-kit-2.webp',
  '/ui-kit/ui-kit-3.webp',
  '/ui-kit/ui-kit-4.webp',
  '/ui-kit/ui-kit-5.webp',
  '/ui-kit/ui-kit-6.webp',
] as const;

const FEATURES = [
  {
    icon: Stack,
    title: 'TanStack Start + Router',
    body: 'File-based routing, SSR-ready, wired to React 19 and Vite 8 out of the box.',
  },
  {
    icon: Package,
    title: '50+ shadcn components',
    body: 'A full base-luma catalog with Hugeicons, ready to compose into product UI.',
  },
  {
    icon: Sparkle,
    title: 'Semantic design tokens',
    body: 'Color, spacing, motion, shadow, and type are tokens with one source of truth in styles.css — so agent output stays consistent and on-brand.',
  },
  {
    icon: Lightning,
    title: 'Built for AI agents',
    body: 'AGENTS.md teaches agents the token rules, so they generate design-system-matched UI instead of AI slop.',
  },
] as const;

const INCLUDED = [
  'One-line install command + project scaffolder',
  '50+ shadcn (base-luma) components',
  'Semantic design tokens + living /ui-kit catalog',
  'TanStack Start + Router + Tailwind v4 setup',
  'Geist Variable type system & motion presets',
  'Access token to the private component registry',
  'Lifetime access — one-time payment',
] as const;

const FAQS = [
  {
    q: 'What exactly do I get?',
    a: 'After payment you receive an email with the install command, a setup guideline, and your access token for the private registry. Run it and the scaffolder sets up the whole kit.',
  },
  {
    q: 'Is this a one-time payment?',
    a: 'Yes. Pay once, keep it forever — including future updates. No subscription.',
  },
  {
    q: 'How is it delivered?',
    a: 'Delivery is by email right after checkout. Make sure to use a valid address at payment.',
  },
  {
    q: 'What stack does it use?',
    a: 'React 19, TanStack Start + Router, Tailwind CSS v4, shadcn/ui (base-luma), and Bun. Fully typed with TypeScript.',
  },
  {
    q: 'Will an AI agent actually stay on-brand?',
    a: 'Yes — agents compose from semantic tokens defined once in styles.css, so generated screens match your design system instead of drifting into AI slop.',
  },
  {
    q: 'Can I use it for client / commercial work?',
    a: 'Yes. Build unlimited personal and commercial projects with it.',
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      'Skipped a week of boilerplate. The token-based design system is the part I always get wrong — here it just worked.',
    name: 'Indie hacker',
    role: 'Early access',
  },
  {
    quote:
      'The /ui-kit catalog alone is worth it. Every component documented and themeable out of the box.',
    name: 'Frontend dev',
    role: 'Early access',
  },
  {
    quote:
      'Cleanest agent-ready starter I have dropped into. Biome + AGENTS.md means my agents stop making a mess.',
    name: 'Solo founder',
    role: 'Early access',
  },
] as const;

const sectionViewport = { once: true, margin: '-100px' } as const;

const primaryCtaClass =
  'inline-flex items-center gap-2 rounded-full btn-embossed px-8 py-4 text-[15px] font-medium text-white active:scale-[0.96] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card';

interface CheckoutProps {
  onCheckout: () => void;
}

function HeroSection({ onCheckout }: CheckoutProps) {
  const { price, demoUrl, name, tagline } = UI_KIT;
  return (
    <m.section
      initial="hidden"
      animate="show"
      variants={stagger}
      className="flex flex-col items-center text-center pt-4"
    >
      <m.span
        variants={fadeUp}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] font-medium text-muted theme-transition"
      >
        <Sparkle size={14} weight="fill" className="text-foreground" />
        AI-agent starter kit
      </m.span>
      <m.h1
        variants={fadeUp}
        className="mt-6 max-w-3xl text-[2.5rem] sm:text-[3.5rem] leading-[1.05] font-semibold tracking-tight text-foreground"
      >
        {tagline}
      </m.h1>
      <m.p variants={fadeUp} className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
        {name} is a production-grade TanStack Start + shadcn/ui boilerplate where every
        color, space, and radius is a semantic token. Point your AI agent at it and you
        get on-brand UI, not AI slop — consistent on every prompt.
      </m.p>
      <m.div variants={fadeUp} className="mt-9 flex flex-col sm:flex-row items-center gap-3">
        <button type="button" onClick={onCheckout} className={primaryCtaClass}>
          Get {name} — {formatIDR(price.amount)}
        </button>
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-[15px] font-medium text-foreground hover:bg-surface active:scale-[0.97] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Live preview <ArrowUpRight size={16} weight="bold" />
        </a>
      </m.div>
      <m.p variants={fadeUp} className="mt-4 text-[13px] text-muted">
        One-time payment ·{' '}
        <span className="line-through opacity-60">{formatIDR(price.original)}</span>{' '}
        <span className="font-medium text-foreground">{formatIDR(price.amount)}</span>{' '}
        launch price
      </m.p>
    </m.section>
  );
}

function PreviewSection() {
  const { demoUrl, name } = UI_KIT;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeSrc = activeIndex !== null ? SCREENSHOTS[activeIndex] : null;

  return (
    <m.section initial="hidden" whileInView="show" viewport={sectionViewport} variants={stagger}>
      <m.div
        variants={fadeUpLite}
        className="relative isolate z-0 aspect-video w-full border border-border bg-surface-nested theme-transition"
      >
        <video
          className="pointer-events-auto h-full w-full overflow-hidden rounded-[2rem] object-cover"
          controls
          preload="metadata"
          playsInline
        >
          {/* #t=0.1 forces the browser to render the first frame as the poster */}
          <source
            src="https://0nzst7ka0j.ufs.sh/f/octNiMKDR9jHqEs1tcXGt7SWNMR1XjvU0uJxB9pDIlaZqdb6"
            type="video/mp4"
          />
          {/* TODO: replace placeholder with authored captions for the walkthrough audio */}
          <track kind="captions" srcLang="en" label="English" src="/ui-kit/walkthrough.en.vtt" />
        </video>
      </m.div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SCREENSHOTS.map((src, i) => (
          <m.button
            key={src}
            type="button"
            variants={fadeUp}
            onClick={() => setActiveIndex(i)}
            aria-label={`View ${name} screenshot ${i + 1} full size`}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-nested text-left theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <img
              src={src}
              alt={`${name} screenshot ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10" />
          </m.button>
        ))}
      </div>

      {activeSrc !== null && activeIndex !== null ? (
        <ImageLightbox
          src={activeSrc}
          alt={`${name} screenshot ${activeIndex + 1}`}
          onClose={() => setActiveIndex(null)}
          onPrev={activeIndex > 0 ? () => setActiveIndex(activeIndex - 1) : undefined}
          onNext={
            activeIndex < SCREENSHOTS.length - 1
              ? () => setActiveIndex(activeIndex + 1)
              : undefined
          }
        />
      ) : null}

      <div className="mt-6 flex justify-center">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[15px] font-medium text-foreground hover:opacity-80 transition-opacity"
        >
          Explore the live demo at ui.faizintifada.com
          <ArrowUpRight size={16} weight="bold" />
        </a>
      </div>
    </m.section>
  );
}

function AntiSlopSection() {
  const { name } = UI_KIT;
  return (
    <m.section initial="hidden" whileInView="show" viewport={sectionViewport} variants={stagger}>
      <m.h2
        variants={fadeUp}
        className="text-center text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-foreground"
      >
        Your AI agent stops generating AI slop.
      </m.h2>
      <m.p
        variants={fadeUp}
        className="mx-auto mt-3 max-w-xl text-center text-[16px] leading-relaxed text-muted"
      >
        Aim an agent at a blank Tailwind project and you get random hex colors,
        magic-number spacing, and components that drift from your brand every prompt.{' '}
        {name} gives the agent rails.
      </m.p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <m.div
          variants={fadeUp}
          className="rounded-[1.75rem] border border-border bg-surface-nested p-8 theme-transition"
        >
          <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">
            Without a design system
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Hardcoded values: #3b82f6, p-[13px], one-off shadows',
              'Every screen looks subtly different',
              'Light / dark mode breaks',
              'You refactor whatever the agent generated',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <X size={18} weight="bold" className="mt-0.5 shrink-0 text-muted" />
                <span className="text-[15px] leading-relaxed text-muted">{item}</span>
              </li>
            ))}
          </ul>
        </m.div>

        <m.div
          variants={fadeUp}
          className="rounded-[1.75rem] border border-border bg-canvas p-8 theme-transition"
        >
          <p className="text-[13px] font-semibold uppercase tracking-wider text-foreground">
            With {name}
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Agents compose from semantic tokens — bg-surface, text-muted — never raw values',
              'One source of truth: styles.css',
              'Consistent across every component and route',
              'Theme-aware by default',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-foreground" />
                <span className="text-[15px] leading-relaxed text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </m.div>
      </div>

      <m.p
        variants={fadeUp}
        className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-muted"
      >
        One source of truth —{' '}
        <code className="rounded-md bg-surface px-1.5 py-0.5 text-[13px] text-foreground">
          styles.css
        </code>
        . Change a token there and every screen your agent ever generated updates with it.
      </m.p>
    </m.section>
  );
}

function FeaturesSection() {
  return (
    <m.section initial="hidden" whileInView="show" viewport={sectionViewport} variants={stagger}>
      <m.h2
        variants={fadeUp}
        className="text-center text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-foreground"
      >
        Everything inside the kit
      </m.h2>
      <m.p variants={fadeUp} className="mx-auto mt-3 max-w-md text-center text-[16px] text-muted">
        Opinionated where it matters, flexible where you need it.
      </m.p>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <m.div
            key={title}
            variants={fadeUp}
            className="rounded-[1.75rem] border border-border bg-canvas p-8 theme-transition"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-surface text-foreground">
              <Icon size={24} weight="regular" />
            </div>
            <h3 className="mt-5 text-[18px] font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
          </m.div>
        ))}
      </div>
    </m.section>
  );
}

function PricingSection({ onCheckout }: CheckoutProps) {
  const { price, name } = UI_KIT;
  return (
    <m.section
      initial="hidden"
      whileInView="show"
      viewport={sectionViewport}
      variants={stagger}
      className="flex justify-center"
    >
      <m.div
        variants={fadeUp}
        className="w-full max-w-md rounded-[2.5rem] border border-border bg-canvas p-8 sm:p-10 text-center theme-transition"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-[13px] font-medium text-muted">
          Launch offer
        </span>
        <div className="mt-6 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
          <span className="text-[2.5rem] sm:text-[3rem] leading-none font-semibold tracking-tight tabular-nums text-foreground">
            {formatIDR(price.amount)}
          </span>
          <span className="mb-1 text-[16px] sm:text-[18px] text-muted line-through tabular-nums">
            {formatIDR(price.original)}
          </span>
        </div>
        <p className="mt-2 text-[14px] text-muted">One-time payment · lifetime access</p>

        <ul className="mt-8 space-y-3 text-left">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-foreground" />
              <span className="text-[15px] text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onCheckout}
          className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full btn-embossed px-8 py-4 text-[15px] font-medium text-white active:scale-[0.96] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Buy {name} now
        </button>
        <p className="mt-4 text-[13px] text-muted">Delivered to your email after checkout.</p>
      </m.div>
    </m.section>
  );
}

function TestimonialsSection() {
  return (
    <m.section initial="hidden" whileInView="show" viewport={sectionViewport} variants={stagger}>
      <m.h2
        variants={fadeUp}
        className="text-center text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-foreground"
      >
        Loved by early builders
      </m.h2>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map(({ quote, name: who, role }) => (
          <m.figure
            key={quote}
            variants={fadeUp}
            className="flex flex-col rounded-[1.75rem] border border-border bg-canvas p-8 theme-transition"
          >
            <div className="flex gap-0.5 text-foreground">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} weight="fill" />
              ))}
            </div>
            <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-foreground">
              “{quote}”
            </blockquote>
            <figcaption className="mt-6 text-[14px]">
              <span className="font-medium text-foreground">{who}</span>
              <span className="text-muted"> · {role}</span>
            </figcaption>
          </m.figure>
        ))}
      </div>
    </m.section>
  );
}

function FaqSection() {
  return (
    <m.section
      initial="hidden"
      whileInView="show"
      viewport={sectionViewport}
      variants={stagger}
      className="mx-auto w-full max-w-2xl"
    >
      <m.h2
        variants={fadeUp}
        className="text-center text-[2rem] sm:text-[2.25rem] font-semibold tracking-tight text-foreground"
      >
        Questions, answered
      </m.h2>
      <div className="mt-10 space-y-3">
        {FAQS.map(({ q, a }) => (
          <m.details
            key={q}
            variants={fadeUp}
            className="group rounded-2xl border border-border bg-canvas px-6 py-5 theme-transition"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-[16px] font-medium text-foreground marker:content-['']">
              {q}
              <span className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
          </m.details>
        ))}
      </div>
    </m.section>
  );
}

function FinalCtaSection({ onCheckout }: CheckoutProps) {
  const { price, name } = UI_KIT;
  return (
    <m.section initial="hidden" whileInView="show" viewport={sectionViewport} variants={fadeUp}>
      <div className="rounded-[2.5rem] border border-border bg-canvas px-8 py-14 sm:py-20 text-center theme-transition">
        <h2 className="mx-auto max-w-2xl text-[2rem] sm:text-[2.5rem] leading-tight font-semibold tracking-tight text-foreground">
          Ship your next AI-agent app this weekend.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[16px] text-muted">
          Grab {name} at the launch price — {formatIDR(price.amount)}, once.
        </p>
        <button
          type="button"
          onClick={onCheckout}
          className="mt-8 inline-flex items-center gap-2 rounded-full btn-embossed px-8 py-4 text-[15px] font-medium text-white active:scale-[0.96] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Get {name} now
        </button>
      </div>
    </m.section>
  );
}

export function UiKit() {
  const { name, tagline, price } = UI_KIT;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const openCheckout = () => setCheckoutOpen(true);

  return (
    <>
      {checkoutOpen ? <CheckoutDialog onClose={() => setCheckoutOpen(false)} /> : null}

      <Seo
        title="Faiz UI — AI-Agent Starter Kit"
        description="Faiz UI is a TanStack Start + shadcn/ui starter kit for AI-agent apps. 50+ components, semantic design tokens, and a living catalog. Semantic tokens keep AI-generated UI on-brand, not AI slop. One-time payment."
        path="/ui"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name,
          description: tagline,
          offers: {
            '@type': 'Offer',
            price: price.amount,
            priceCurrency: price.currency,
            availability: 'https://schema.org/InStock',
            url: 'https://faizintifada.com/ui',
          },
        }}
      />

      <main className="space-y-28 sm:space-y-36">
        <HeroSection onCheckout={openCheckout} />
        <PreviewSection />
        <AntiSlopSection />
        <FeaturesSection />
        <PricingSection onCheckout={openCheckout} />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection onCheckout={openCheckout} />
      </main>
    </>
  );
}
