import { Component, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Contains render and lazy-load failures (e.g. a route chunk that cannot be
 * downloaded) to the current page so the navigation keeps working.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <main className="route-status">
        <div role="alert">
          <h1>This page failed to load</h1>
          <p>
            Check your connection and reload to try again. The rest of the site is still
            available from the menu.
          </p>
        </div>
        <button
          type="button"
          className="route-status__button"
          // A reload is needed because a failed lazy import stays cached for this page view.
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </main>
    );
  }
}
