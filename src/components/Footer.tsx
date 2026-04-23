import { TwitterLogo, DribbbleLogo, LinkedinLogo, InstagramLogo } from '@phosphor-icons/react';

export function Footer() {
  return (
    <footer className="mt-32 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
      <p className="text-[14px] text-gray-400 font-medium tracking-wide">
        © 2024 Satya. All rights reserved.
      </p>
      <div className="flex items-center space-x-6 text-gray-600">
        <a href="#" className="hover:text-gray-900 transition-colors">
          <TwitterLogo size={20} weight="fill" />
        </a>
        <a href="#" className="hover:text-gray-900 transition-colors">
          <DribbbleLogo size={20} weight="fill" />
        </a>
        <a href="#" className="hover:text-gray-900 transition-colors">
          <LinkedinLogo size={20} weight="fill" />
        </a>
        <a href="#" className="hover:text-gray-900 transition-colors">
          <InstagramLogo size={20} weight="fill" />
        </a>
      </div>
    </footer>
  );
}
