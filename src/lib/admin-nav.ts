import type { Icon } from '@phosphor-icons/react';
import {
  ChatsCircle,
  FolderOpen,
  GearSix,
  Quotes,
} from '@phosphor-icons/react';

export type AdminNavItem = {
  to: string;
  label: string;
  icon: Icon;
  /** When true, NavLink only matches the exact path (not child routes). */
  end?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Content',
    items: [
      { to: '/admin/projects', label: 'Projects', icon: FolderOpen, end: true },
      { to: '/admin/coaching', label: 'Coaching', icon: ChatsCircle },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/page', label: 'Page settings', icon: GearSix },
      { to: '/admin/testimonials', label: 'Testimonials', icon: Quotes },
    ],
  },
];
