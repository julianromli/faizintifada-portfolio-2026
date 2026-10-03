import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'motion/react';
import { Seo } from '../components/Seo';
import { UI_KIT } from '../constants';
import { EASE_OUT } from '../lib/motion';

export function UiKitThankYou() {
  const reduce = useReducedMotion();
  const checkRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const check = checkRef.current;
    const path = pathRef.current;
    if (!check || !path) return;

    const len = Math.ceil(path.getTotalLength());
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    check.setAttribute('data-state', 'out');
    void check.offsetWidth;
    check.setAttribute('data-state', 'in');
  }, []);

  const textAnim = (delay: number) =>
    reduce
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, ease: EASE_OUT },
        }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE_OUT, delay },
        };

  return (
    <>
      <Seo title="Thank you" path="/ui/thank-you" noIndex />
      <main className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <span ref={checkRef} className="t-success-check" data-state="out" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
            <path
              ref={pathRef}
              d="M10 24 L20 34 L38 14"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <m.h1 {...textAnim(0.08)} className="mt-6 max-w-xl text-[2rem] sm:text-[2.5rem] leading-tight font-semibold tracking-tight text-foreground">
          Payment received — welcome to {UI_KIT.name}.
        </m.h1>
        <m.p {...textAnim(0.14)} className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Check your email for your access token, install command, and quick-start
          guideline. It can take a minute to arrive — also check spam.
        </m.p>
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={UI_KIT.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full btn-embossed px-8 py-4 text-[15px] font-medium text-white focus:outline-none"
          >
            Open the live demo
          </a>
          <Link
            to="/ui"
            className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-[15px] font-medium text-foreground hover:bg-surface active:scale-[0.97] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Back to {UI_KIT.name}
          </Link>
        </div>
      </main>
    </>
  );
}
