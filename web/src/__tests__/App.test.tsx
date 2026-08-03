import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  let originalPathname = '/';

  beforeEach(() => {
    originalPathname = window.location.pathname;
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalPathname);
  });

  it('renders the index page on the root path', () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the database design page on its path', () => {
    window.history.replaceState({}, '', '/database-design-best-practices');
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the database design page under a base path', () => {
    window.history.replaceState(
      {},
      '',
      '/design-patterns/database-design-best-practices',
    );
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });
});
