import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'motion/react';
import { ArrowSquareOut, List, Moon, SignOut, Sun, X } from '@phosphor-icons/react';
import { ADMIN_NAV_GROUPS } from '../../lib/admin-nav';
import { SEO } from '../../lib/seo';
import { clearAdminToken } from '../../lib/admin-api';
import { useTheme } from '../../hooks/useTheme';
import { SoundSettingsRow } from '../SoundToggle';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium theme-transition',
    isActive
      ? 'bg-surface text-foreground'
      : 'text-muted hover:bg-surface/60 hover:text-foreground',
  ].join(' ');

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function SidebarFooter() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  function signOut() {
    clearAdminToken();
    navigate('/admin', { replace: true });
  }

  return (
    <div className="mt-auto border-t border-border pt-4 space-y-1">
      <button
        type="button"
        onClick={toggleTheme}
        className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium text-muted hover:bg-surface/60 hover:text-foreground theme-transition"
      >
        <span className="relative inline-flex size-[18px] items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <m.span
                key="sun"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              >
                <Sun size={18} aria-hidden />
              </m.span>
            ) : (
              <m.span
                key="moon"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              >
                <Moon size={18} aria-hidden />
              </m.span>
            )}
          </AnimatePresence>
        </span>
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
      <SoundSettingsRow />
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium text-muted hover:bg-surface/60 hover:text-foreground theme-transition"
      >
        <ArrowSquareOut size={18} aria-hidden />
        View site
      </a>
      <button
        type="button"
        onClick={signOut}
        className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium text-muted hover:bg-surface/60 hover:text-foreground theme-transition"
      >
        <SignOut size={18} aria-hidden />
        Sign out
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-6 px-1">
        <NavLink
          to="/admin/projects"
          onClick={onNavigate}
          className="block rounded-lg px-2 py-1 hover:bg-surface/60 theme-transition"
        >
          <span className="block text-[15px] font-semibold tracking-tight text-foreground">
            {SEO.siteName}
          </span>
          <span className="block text-[12px] font-medium text-muted">Admin</span>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto" aria-label="Admin">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} onClick={onNavigate} className={navLinkClass}>
                      <Icon size={18} aria-hidden />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <SidebarFooter />
    </>
  );
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-card p-4 theme-transition',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-[14px] font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close menu"
            className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground theme-transition"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <SidebarContent onNavigate={onMobileClose} />
      </aside>
    </>
  );
}

export function AdminMobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation menu"
      className="flex size-10 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface hover:text-foreground theme-transition lg:hidden"
    >
      <List size={20} aria-hidden />
    </button>
  );
}
