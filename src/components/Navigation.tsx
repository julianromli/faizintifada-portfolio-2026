import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import { NAV_LINKS } from '../constants';
import { ThemeToggle } from './ThemeToggle';

const navLinkClassName =
  'hover:text-foreground active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm inline-block';

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const locationKey = `${location.pathname}${location.hash}`;
  const prevLocationKeyRef = useRef(locationKey);

  if (locationKey !== prevLocationKeyRef.current) {
    prevLocationKeyRef.current = locationKey;
    if (menuOpen) {
      setMenuOpen(false);
    }
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="flex items-center justify-between mb-16 sm:mb-24" aria-label="Main">
      <Link
        to="/"
        className="text-2xl font-semibold tracking-tight text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm active:scale-95 transition-transform duration-200 ease-out"
      >
        Hola!
      </Link>

      <div className="hidden md:flex items-center gap-x-6 text-[15px] text-muted">
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={label} to={to} className={navLinkClassName}>
            {label}
          </Link>
        ))}
        <ThemeToggle />
      </div>

      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          className="flex items-center justify-center size-11 rounded-full border border-border text-muted hover:bg-surface hover:text-foreground active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-menu"
            className="fixed top-6 right-4 left-4 z-50 md:hidden rounded-2xl border border-border bg-card p-6 shadow-lg theme-transition"
          >
            <div className="flex flex-col gap-1 text-[17px] text-muted">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={label}
                  to={to}
                  className="rounded-xl px-4 py-3 font-medium hover:bg-surface hover:text-foreground theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}
