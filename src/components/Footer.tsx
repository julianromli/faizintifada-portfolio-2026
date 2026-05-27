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
    <footer className="mt-32 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
      <p className="text-[14px] text-gray-400 font-medium tracking-wide">
        © {new Date().getFullYear()} Faiz. All rights reserved.
      </p>
      <div className="flex items-center flex-wrap justify-center gap-6 text-gray-600">
        {SOCIAL_LINKS.map(({ href, label, icon }) => {
          const IconComponent = SOCIAL_ICONS[icon];
          return (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm"
            >
              <IconComponent size={20} weight="fill" />
            </a>
          );
        })}
      </div>
    </footer>
  );
}
