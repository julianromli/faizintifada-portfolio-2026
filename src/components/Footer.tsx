import {
  InstagramLogo,
  LinkedinLogo,
  ThreadsLogo,
  XLogo,
  YoutubeLogo,
} from '@phosphor-icons/react';
import { SOCIAL_LINKS } from '../constants';

const SOCIAL_ICONS = {
  x: XLogo,
  instagram: InstagramLogo,
  threads: ThreadsLogo,
  linkedin: LinkedinLogo,
  youtube: YoutubeLogo,
} as const;

export function Footer() {
  return (
    <footer className="mt-32 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 theme-transition">
      <p className="text-[14px] text-muted font-medium tracking-wide" suppressHydrationWarning>
        © {new Date().getFullYear()} Faiz Intifada. All rights reserved.
      </p>
      <div className="flex items-center flex-wrap justify-center gap-6 text-muted">
        {SOCIAL_LINKS.map(({ href, label, icon }) => {
          const IconComponent = SOCIAL_ICONS[icon];
          return (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="hover:text-foreground theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
            >
              <IconComponent size={20} weight="fill" />
            </a>
          );
        })}
      </div>
    </footer>
  );
}
