import type { Variants } from 'motion/react';

/** Strong ease-out for UI motion. Mirrors the CSS --ease-out token. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Shared modal/dialog panel entrance + exit. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.16, ease: EASE_OUT } },
};

/** Reduced-motion counterpart: opacity only, no movement/scale. */
export const panelVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};
