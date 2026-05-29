import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Seo } from '../components/Seo';

export function NotFound() {
  const { pathname } = useLocation();

  return (
    <>
      <Seo title="Page not found" noIndex path={pathname} />
      <main className="min-h-[40vh] flex flex-col items-center justify-center gap-y-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-[15px] text-muted text-center max-w-sm">
        This URL does not match any page on the site.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition"
      >
        <ArrowLeft size={16} />
        <span>Back to home</span>
      </Link>
    </main>
    </>
  );
}
