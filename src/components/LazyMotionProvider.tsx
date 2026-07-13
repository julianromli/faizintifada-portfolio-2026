import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

export function LazyMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* reducedMotion="user" drops transform/layout animations when the user
          prefers reduced motion, while keeping opacity — the gentler-not-zero
          behavior. Covers all whileInView scroll reveals that don't guard
          individually (ProjectCard, LatestVideos, SpeakingGallery, ToolsStack,
          AboutSection, ProjectDetail, UiKit). */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
