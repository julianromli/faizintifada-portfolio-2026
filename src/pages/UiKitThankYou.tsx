import { Link } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { Seo } from '../components/Seo';
import { UI_KIT } from '../constants';

export function UiKitThankYou() {
  return (
    <>
      <Seo title="Thank you" path="/ui/thank-you" noIndex />
      <main className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <CheckCircle size={56} weight="fill" className="text-emerald-500" aria-hidden />
        <h1 className="mt-6 max-w-xl text-[2rem] sm:text-[2.5rem] leading-tight font-semibold tracking-tight text-foreground">
          Payment received — welcome to {UI_KIT.name}.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
          Check your email for your access token, install command, and quick-start
          guideline. It can take a minute to arrive — also check spam.
        </p>
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
