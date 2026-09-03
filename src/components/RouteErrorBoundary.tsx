import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render errors in the lazily-loaded route subtree — most importantly a
 * rejected chunk import after a redeploy, which would otherwise blank the page.
 * Kept inside PublicShell so the nav and footer stay usable.
 *
 * A class component because `getDerivedStateFromError` has no hook equivalent.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[route error]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
          This page failed to load. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center gap-x-2 rounded-full border border-border px-6 py-3 text-[15px] font-medium text-foreground hover:bg-surface active:scale-95 theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
