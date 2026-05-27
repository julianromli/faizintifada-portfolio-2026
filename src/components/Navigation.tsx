import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import { NAV_LINKS } from '../constants';

const navLinkClassName =
  'hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm inline-block';

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

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
        className="text-2xl font-semibold tracking-tight text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm active:scale-95 transition-transform duration-200 ease-out"
      >
        Hola!
      </Link>

      <div className="hidden md:flex items-center space-x-8 text-[15px] text-gray-500">
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={label} to={to} className={navLinkClassName}>
            {label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
      </button>

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
            className="fixed top-6 right-4 left-4 z-50 md:hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
          >
            <div className="flex flex-col gap-1 text-[17px] text-gray-600">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={label}
                  to={to}
                  className="rounded-xl px-4 py-3 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
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
