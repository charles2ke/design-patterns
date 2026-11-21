import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

function BrokenPage(): never {
  throw new Error('Failed to fetch dynamically imported module');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RouteErrorBoundary', () => {
  it('renders the page when nothing fails', () => {
    render(
      <RouteErrorBoundary>
        <p>Page content</p>
      </RouteErrorBoundary>,
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('replaces a failed page with an alert and a working reload button', async () => {
    const user = userEvent.setup();
    // React reports errors caught by boundaries to the console.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RouteErrorBoundary>
        <BrokenPage />
      </RouteErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('This page failed to load');

    const reload = vi.fn();
    // jsdom's location.reload cannot be spied on, so swap in a stub location.
    vi.stubGlobal('location', { ...window.location, reload });
    await user.click(screen.getByRole('button', { name: 'Reload page' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
