import { useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

type TextSwapProps = {
  text: string;
  className?: string;
};

export function TextSwap({ text, className }: TextSwapProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const current = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (current.current === null || reduce || current.current === text) {
      el.textContent = text;
      current.current = text;
      el.classList.remove('is-exit', 'is-enter-start');
      return;
    }

    const dur =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--text-swap-dur'),
      ) || 150;

    el.classList.add('is-exit');
    const timer = window.setTimeout(() => {
      const node = ref.current;
      if (!node) return;
      node.textContent = text;
      current.current = text;
      node.classList.remove('is-exit');
      node.classList.add('is-enter-start');
      void node.offsetHeight;
      node.classList.remove('is-enter-start');
    }, dur);

    return () => window.clearTimeout(timer);
  }, [text, reduce]);

  return <span ref={ref} className={className ? `t-text-swap ${className}` : 't-text-swap'} />;
}
