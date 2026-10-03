import type { Variants } from 'motion/react';

/** Smooth ease-out. Mirrors CSS --ease-out and --ease-smooth-out. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Shared modal/dialog panel entrance + exit. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.15, ease: EASE_OUT } },
};

/** Reduced-motion counterpart: opacity only, no movement/scale. */
export const panelVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};

/** Stagger container for list/table entrance. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/** Stagger item with a gentle rise — for block/list items (<li>). */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Stagger item, opacity only — for table rows (<tr>) where transform can disrupt table layout. */
export const staggerItemOpacity: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};
