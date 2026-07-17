import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { adminBtnPrimarySm } from '../../lib/admin-styles';

type Breadcrumb = {
  label: string;
  to: string;
};

type HeaderAction =
  | { type: 'link'; label: string; to: string; icon?: ReactNode }
  | { type: 'button'; label: string; onClick: () => void; icon?: ReactNode };

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: Breadcrumb;
  action?: HeaderAction;
};

export function AdminPageHeader({ title, description, breadcrumb, action }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 lg:mb-8">
      {breadcrumb ? (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-[14px]">
          <Link
            to={breadcrumb.to}
            className="font-medium text-muted hover:text-foreground theme-transition"
          >
            {breadcrumb.label}
          </Link>
          <CaretRight size={14} className="text-muted" aria-hidden />
          <span className="font-medium text-foreground">{title}</span>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {!breadcrumb ? (
            <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          ) : (
            <h1 className="sr-only">{title}</h1>
          )}
          {description ? <p className="mt-1 text-pretty text-[14px] text-muted sm:text-[15px]">{description}</p> : null}
        </div>

        {action ? (
          action.type === 'link' ? (
            <Link to={action.to} className={`${adminBtnPrimarySm} shrink-0`}>
              {action.icon}
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={`${adminBtnPrimarySm} shrink-0`}>
              {action.icon}
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </header>
  );
}
